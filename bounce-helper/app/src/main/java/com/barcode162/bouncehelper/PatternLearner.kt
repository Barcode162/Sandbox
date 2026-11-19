package com.barcode162.bouncehelper

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Learns the game's habits from recorded flights and uses them on top of the pong physics.
 * Everything fades slowly (older flights count less), so it keeps adapting when the game
 * changes, e.g. as the shark speeds up.
 *
 * 1. Error memory: every prediction made during a flight is compared with where the shark
 *    really landed. The average miss, grouped by "time left until landing" and "wall bounces
 *    still ahead", is added back as a correction.
 * 2. Launch rule: how the game sends the shark off the paddle (out angle from hit position and
 *    in angle, plus the speed-up per hit), fitted with recursive least squares. Lets the helper
 *    know the new path the moment the shark leaves the paddle, before it can be measured.
 * 3. Repeating sequence: if the last few landing spots match an earlier stretch, the spot that
 *    followed last time is a guess for the next one (only used once it has proven right).
 *
 * Runs on the capture thread only (except [requestReset], which is safe from anywhere).
 */
class PatternLearner {

    @Volatile var enabled = true
    // Individual parts (for testing / tuning).
    var useCorrection = true
    var useLaunch = true
    var useSequence = true
    @Volatile private var resetRequested = false
    var screenW = 1080f

    // ---------- stats shown to the user ----------
    var flights = 0; private set
    /** Typical miss (px) of the corrected prediction a quarter second or more before landing. */
    var accuracyPx = -1f; private set

    fun requestReset() { resetRequested = true }

    private fun checkReset() {
        if (!resetRequested) return
        resetRequested = false
        wSum.fill(0f); eSum.fill(0f); e2Sum.fill(0f)
        pending.clear()
        theta.fill(0.0)
        for (i in 0 until 3) for (j in 0 until 3) p[i][j] = if (i == j) 10.0 else 0.0
        launches = 0; speedRatio = 1f; launchResid = 1f; launchPending = false
        landings.clear(); seqGuess = null; seqScore = 0f
        flights = 0; accuracyPx = -1f
    }

    // =================================================================
    // 1. Error memory
    // =================================================================

    private val timeEdges = floatArrayOf(0.08f, 0.16f, 0.25f, 0.35f, 0.5f, 0.7f, 1.0f, 1.5f)
    private val nT = timeEdges.size + 1
    private val nB = 4
    private val wSum = FloatArray(nT * nB)
    private val eSum = FloatArray(nT * nB)
    private val e2Sum = FloatArray(nT * nB)

    private class Pending(val bin: Int, val raw: Float, val corrected: Float, val t: Float)
    private val pending = ArrayList<Pending>()

    private fun bin(timeToLand: Float, bounces: Int): Int {
        var ti = timeEdges.size
        for (i in timeEdges.indices) if (timeToLand < timeEdges[i]) { ti = i; break }
        return ti * nB + bounces.coerceIn(0, nB - 1)
    }

    /** Learned correction (px) to add to a physics prediction. */
    fun correction(timeToLand: Float, bounces: Int): Float {
        checkReset()
        if (!enabled || !useCorrection) return 0f
        val b = bin(timeToLand, bounces)
        val w = wSum[b]                 // ≈ number of (recent) flights seen in this group
        if (w < 3f) return 0f
        val mean = eSum[b] / w
        val sd = sqrt(max(0f, e2Sum[b] / w - mean * mean))
        // Only correct a miss that's clearly real, not just noise: |mean| well above its uncertainty.
        val noise = sd / sqrt(w)
        if (abs(mean) < 2.5f * noise || abs(mean) < 2f) return 0f
        return mean * (w / (w + 3f))
    }

    /** Remember a prediction made during the current flight, to grade it on landing. */
    fun onPrediction(raw: Float, corrected: Float, timeToLand: Float, bounces: Int) {
        if (pending.size < 120) pending.add(Pending(bin(timeToLand, bounces), raw, corrected, timeToLand))
    }

    /** The shark reached the paddle line at [x] (screen px). */
    fun onLanding(x: Float) {
        checkReset()
        flights++
        if (pending.isNotEmpty()) {
            // Fade old knowledge a little each flight so it adapts.
            for (i in wSum.indices) { wSum[i] *= 0.96f; eSum[i] *= 0.96f; e2Sum[i] *= 0.96f }
            // Predictions within one flight share the same mistake, so average them per group
            // first: each flight is ONE lesson per group, not dozens.
            val sum = FloatArray(wSum.size); val cnt = IntArray(wSum.size)
            var accSum = 0f; var accN = 0
            for (p in pending) {
                val err = x - p.raw
                if (abs(err) > screenW * 0.35f) continue   // tracking glitch, ignore
                sum[p.bin] += err; cnt[p.bin]++
                if (p.t >= 0.25f) { accSum += abs(x - p.corrected); accN++ }
            }
            for (i in sum.indices) if (cnt[i] > 0) {
                val e = sum[i] / cnt[i]
                wSum[i] += 1f; eSum[i] += e; e2Sum[i] += e * e
            }
            if (accN > 0) {
                val a = accSum / accN
                accuracyPx = if (accuracyPx < 0) a else accuracyPx * 0.8f + a * 0.2f
            }
        }
        pending.clear()

        // sequence bookkeeping
        seqGuess?.let { g ->
            val hit = abs(g - x) < screenW * 0.05f
            seqScore = seqScore * 0.7f + (if (hit) 0.3f else 0f)
        }
        landings.add(x / screenW)
        if (landings.size > 300) landings.removeAt(0)
        seqGuess = findSequenceGuess()
    }

    // =================================================================
    // 2. Launch rule (out angle = a + b*hitOffset + c*inAngle), angles from straight up
    // =================================================================

    private val theta = DoubleArray(3)
    private val p = Array(3) { i -> DoubleArray(3) { j -> if (i == j) 10.0 else 0.0 } }
    private var launches = 0
    private var speedRatio = 1f
    private var launchResid = 1f       // typical error of the rule, radians
    private var launchPending = false
    private var lH = 0f; private var lInAng = 0f; private var lInSpeed = 0f

    /** The shark just bounced off the paddle. Returns a learned (vx, vy) for the new path, if trusted. */
    fun onPaddleHit(hitOffset: Float, inVx: Float, inVy: Float): Pair<Float, Float>? {
        checkReset()
        val inSpeed = sqrt(inVx * inVx + inVy * inVy)
        if (inSpeed < 1f) return null
        lH = hitOffset.coerceIn(-1.5f, 1.5f)
        lInAng = kotlin.math.atan2(inVx, inVy)          // 0 = straight down, + = heading right
        lInSpeed = inSpeed
        launchPending = true
        if (!enabled || !useLaunch || !launchRuleKnown) return null
        val a = (theta[0] + theta[1] * lH + theta[2] * lInAng).toFloat().coerceIn(-1.3f, 1.3f)
        val speed = inSpeed * speedRatio
        return kotlin.math.sin(a) * speed to -kotlin.math.cos(a) * speed
    }

    /** Something else (a wall) interrupted before the launch could be measured. */
    fun cancelLaunch() { launchPending = false }

    /** The new path after a paddle hit has been measured well. */
    fun onLaunchMeasured(vx: Float, vy: Float) {
        if (!launchPending) return
        launchPending = false
        val speed = sqrt(vx * vx + vy * vy)
        if (speed < 1f || vy >= 0f) return
        val outAng = kotlin.math.atan2(vx, -vy).toDouble()     // 0 = straight up, + = heading right
        val x = doubleArrayOf(1.0, lH.toDouble(), lInAng.toDouble())
        val predicted = theta[0] * x[0] + theta[1] * x[1] + theta[2] * x[2]
        val resid = abs(outAng - predicted).toFloat()
        launchResid = if (launches == 0) 1f else launchResid * 0.7f + resid * 0.3f
        // recursive least squares with forgetting
        val lambda = 0.97
        val px = DoubleArray(3) { i -> (0 until 3).sumOf { j -> p[i][j] * x[j] } }
        val denom = lambda + (0 until 3).sumOf { i -> x[i] * px[i] }
        val k = DoubleArray(3) { px[it] / denom }
        val e = outAng - predicted
        for (i in 0 until 3) theta[i] += k[i] * e
        for (i in 0 until 3) for (j in 0 until 3) p[i][j] = (p[i][j] - k[i] * px[j]) / lambda
        val ratio = (speed / lInSpeed).coerceIn(0.5f, 2f)
        speedRatio = if (launches == 0) ratio else speedRatio * 0.8f + ratio * 0.2f
        launches++
    }

    val launchRuleKnown get() = launches >= 4 && launchResid <= 0.08f

    /** Typical error (px/s) of the learned launch velocity at this speed. */
    fun launchSigma(speed: Float): Float = max(0.02f, launchResid) * speed * 1.6f   // a little cautious

    // =================================================================
    // 3. Repeating landing sequence
    // =================================================================

    private val landings = ArrayList<Float>()   // fractions of screen width
    private var seqGuess: Float? = null
    private var seqScore = 0f

    private fun findSequenceGuess(): Float? {
        val m = 3
        val n = landings.size
        if (n < m + 2) return null
        val tol = 0.03f
        for (i in n - 2 downTo m - 1) {
            var match = true
            for (k in 0 until m) {
                if (abs(landings[i - k] - landings[n - 1 - k]) > tol) { match = false; break }
            }
            if (match) return landings[i + 1] * screenW
        }
        return null
    }

    /** Guess for the next landing from a repeating pattern, only once it has proven reliable. */
    fun sequenceGuess(): Float? = if (enabled && useSequence && seqScore > 0.5f) seqGuess else null
}

/** Like [Tracker.fold] but also counts how many wall bounces the path takes (capped at 3). */
internal fun foldBounces(x: Float, lo: Float, hi: Float): Int {
    val span = hi - lo
    if (span <= 0f) return 0
    val k = kotlin.math.floor((x - lo) / span).toInt()
    return min(3, abs(if (k < 0) k else k))
}
