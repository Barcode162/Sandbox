package com.barcode162.bouncehelper

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * One captured screen frame, downscaled. Pixels are RGBA bytes, row by row.
 * [scaleX]/[scaleY] convert frame pixels to real screen pixels.
 */
class Frame(
    val width: Int,
    val height: Int,
    val rgba: ByteArray,
    val scaleX: Float,
    val scaleY: Float,
)

/** A connected blob of matching pixels, in screen pixels. */
data class Blob(val cx: Float, val cy: Float, val halfW: Float, val halfH: Float, val pixels: Int)

data class TrackResult(
    val shark: Blob?,
    val paddle: Blob?,
    val vx: Float,
    val vy: Float,
    /** Screen x where the shark's centre will be when it reaches the paddle, or null if unknown. */
    val landingX: Float?,
    /** Seconds from *now* (delay already subtracted) until the shark reaches the paddle, or null. */
    val timeToLand: Float? = null,
    /** Smoothed shark centre at the moment the frame was shown, moved forward by the delay. */
    val nowX: Float = 0f,
    val nowY: Float = 0f,
    /** Flights the pattern learner has seen, and its typical miss (px, -1 = not yet known). */
    val learnedFlights: Int = 0,
    val learnedAccuracy: Float = -1f,
    val launchRuleKnown: Boolean = false,
)

/**
 * Finds the shark by colour, measures its speed, and predicts where it will come down,
 * following its straight-line reflections off the side walls and ceiling (like pong).
 *
 * Walls/ceiling start at the screen edges and are learned automatically the first time the
 * shark visibly bounces off each one, so games with borders work too.
 */
class Tracker {

    // ---- Settings (written from the UI thread, read on the capture thread) ----
    @Volatile var sharkColor = -1          // 0xRRGGBB, or -1 when not picked yet
    @Volatile var paddleColor = -1
    @Volatile var tolerance = 60           // RGB distance
    @Volatile var paddleY = -1f            // screen px; < 0 when not set
    @Volatile var screenW = 0f
    @Volatile var screenH = 0f
    /** Screen rectangle to ignore (our own floating strip). [l, t, r, b] */
    @Volatile var exclude = floatArrayOf(0f, 0f, 0f, 0f)
    /** Total delay (seconds) between the screen showing a frame and our finger acting on it. */
    @Volatile var leadSec = 0.06f

    // ---- Learned play-area edges (screen px) ----
    var leftWall: Float? = null; private set
    var rightWall: Float? = null; private set
    var topWall: Float? = null; private set

    private class Sample(val t: Long, val x: Float, val y: Float)
    private val history = ArrayDeque<Sample>()
    private var vx = 0f
    private var vy = 0f
    private var fitX = 0f            // smoothed position at the latest sample
    private var fitY = 0f
    private var vxSign = 0
    private var vySign = 0
    private var lastSeen = 0L

    /**
     * Learned constant vertical pull (px/s², + = down). Straight-line games stay ~0; games where
     * the emoji falls in arcs learn their gravity from the curve of each finished flight.
     */
    var gravity = 0f; private set
    private var gravityWeight = 0f
    /** Gravity actually used: only once learned and clearly not just noise. */
    val gUse get() = if (gravityWeight >= 3f && abs(gravity) > screenH * 0.12f) gravity else 0f

    /** Spots where a same-coloured thing sat still (e.g. the emoji in a chat bubble). */
    private val staticSpots = ArrayList<FloatArray>()   // [x, y, expiryNanos]
    private var stillSince = 0L

    /** Learns this game's habits from finished flights (see [PatternLearner]). */
    val learner = PatternLearner()
    private var lastPaddle: Blob? = null
    private var awaitingLanding = true
    private var sincePaddleHit = -1
    private var launchEst: Pair<Float, Float>? = null

    private var mask = BooleanArray(0)
    private var seen = BooleanArray(0)
    private var queue = IntArray(0)

    fun resetMotion() {
        history.clear()
        vx = 0f; vy = 0f; vxSign = 0; vySign = 0
        launchEst = null; sincePaddleHit = -1
    }

    fun resetWalls() {
        leftWall = null; rightWall = null; topWall = null
    }

    fun process(f: Frame, tNanos: Long): TrackResult {
        val py = paddleY
        val sharkRowEnd = if (py > 0) min(f.height, (py / f.scaleY).toInt() + 1) else f.height
        staticSpots.removeAll { it[2] < tNanos }
        // Stick with the thing we're already following (not a look-alike elsewhere on screen).
        var prefX = -1f; var prefY = -1f
        if (history.isNotEmpty() && tNanos - lastSeen < 250_000_000L) {
            val dt = (tNanos - history.last().t) / 1e9f
            prefX = fitX + vx * dt; prefY = fitY + vy * dt + 0.5f * gUse * dt * dt
        }
        val shark = if (sharkColor >= 0) detect(f, sharkColor, 0, sharkRowEnd, prefX, prefY, avoidStatic = true) else null

        var paddle: Blob? = null
        if (paddleColor >= 0 && py > 0) {
            val band = (screenH * 0.04f / f.scaleY).toInt() + 2
            val row = (py / f.scaleY).toInt()
            // A "paddle" wider than 60% of the screen is really background (e.g. black paddle on dark mode).
            paddle = detect(f, paddleColor, max(0, row - band), min(f.height, row + band), maxHalfW = screenW * 0.3f)
        }
        if (paddle != null) lastPaddle = paddle
        learner.screenW = screenW

        if (shark == null) {
            if (tNanos - lastSeen > 300_000_000L) resetMotion()
            return TrackResult(null, paddle, 0f, 0f, null)
        }
        lastSeen = tNanos
        addSample(tNanos, shark, 2.5f * max(f.scaleX, f.scaleY))
        // Something that hasn't moved for 0.6 s while a twin exists is probably a static copy.
        if (hypot(vx, vy) > screenH * 0.03f) stillSince = tNanos
        else if (tNanos - stillSince > 600_000_000L && candidateCount > 1) {
            staticSpots.add(floatArrayOf(shark.cx, shark.cy, (tNanos + 10_000_000_000L).toFloat()))
            stillSince = tNanos
            resetMotion()
        }
        val lo = (leftWall ?: 0f) + shark.halfW
        val hi = (rightWall ?: screenW) - shark.halfW
        val lead = leadSec
        val nowX = fold(fitX + vx * lead, lo, hi)
        val nowY = fitY + vy * lead + 0.5f * gUse * lead * lead
        val (landX, tLand) = predict(shark)
        return TrackResult(
            shark, paddle, vx, vy, landX,
            timeToLand = tLand?.let { it - lead },
            nowX = nowX, nowY = nowY,
            learnedFlights = learner.flights,
            learnedAccuracy = learner.accuracyPx,
            launchRuleKnown = learner.launchRuleKnown,
        )
    }

    private fun addSample(t: Long, b: Blob, noise: Float) {
        var bouncedX = false
        var bouncedY = false
        val p = history.lastOrNull()
        val prevVx = vx
        val prevVy = vy
        val prevVySign = vySign
        val dtPrev = if (p != null) (t - p.t) / 1e9f else 0f
        val landY = paddleY - b.halfH
        if (p != null) {
            val dx = b.cx - p.x
            val dy = b.cy - p.y
            val dt = (t - p.t) / 1e9f
            if (vxSign != 0 && dx * vxSign < -noise) {
                bouncedX = true
                // A sideways flip near the paddle is a paddle hit, not a wall.
                val nearPaddle = paddleY > 0 && b.cy > paddleY - b.halfH * 4f
                if (!nearPaddle) {
                    // The bounce point lies between the two samples: before + after + travel = 2 * wall.
                    val travel = abs(vx) * dt
                    if (vxSign > 0 && b.cx > screenW * 0.6f) {
                        val wall = (p.x + b.cx + travel) / 2f + b.halfW
                        rightWall = min(screenW, max(rightWall ?: 0f, wall))
                    }
                    if (vxSign < 0 && b.cx < screenW * 0.4f) {
                        val wall = (p.x + b.cx - travel) / 2f - b.halfW
                        leftWall = max(0f, min(leftWall ?: screenW, wall))
                    }
                }
            }
            // A real bounce flips the direction suddenly; the top of a gravity arc does it slowly.
            if (vySign != 0 && dy * vySign < -noise && abs(prevVy) * dt > noise * 0.8f) {
                bouncedY = true
                // Only a bounce in the upper part of the screen is the ceiling (lower = paddle).
                if (vySign < 0 && paddleY > 0 && b.cy < paddleY * 0.6f) {
                    val wall = (p.y + b.cy - abs(vy) * dt) / 2f - b.halfH
                    topWall = max(0f, min(topWall ?: screenH, wall))
                }
            }
        }
        if (bouncedX || bouncedY) {
            learnGravity()
            history.clear()
            if (bouncedX) vx = -vx
            if (bouncedY) vy = -vy
            val paddleHit = bouncedY && prevVySign > 0 && paddleY > 0 && b.cy > paddleY * 0.6f
            if (paddleHit && p != null) {
                // Where it touched: follow the old path from the previous frame to the landing line.
                val tc = if (prevVy > 1f) ((landY - p.y) / prevVy).coerceIn(0f, dtPrev) else 0f
                val contactX = p.x + prevVx * tc
                if (awaitingLanding) { learner.onLanding(contactX); awaitingLanding = false }
                val pad = lastPaddle
                val hit = if (pad != null && pad.halfW > 1f) (contactX - pad.cx) / pad.halfW else 0f
                // The learned launch rule knows the new path right away (null until it's learned).
                launchEst = learner.onPaddleHit(hit, prevVx, prevVy)
                launchEst?.let { vx = it.first; vy = it.second }
                sincePaddleHit = 0
            } else if (sincePaddleHit >= 0) {
                learner.cancelLaunch(); sincePaddleHit = -1; launchEst = null
            }
        } else if (p != null && awaitingLanding && paddleY > 0 && p.y < landY && b.cy >= landY) {
            // Crossed the paddle line without a bounce (a miss, or a game that lets it sink in).
            val k = (landY - p.y) / (b.cy - p.y)
            learner.onLanding(p.x + (b.cx - p.x) * k)
            awaitingLanding = false
        }
        history.addLast(Sample(t, b.cx, b.cy))
        // Keep every sample since the last bounce. With known gravity the path is an exact
        // parabola, so a longer window is safe; otherwise keep it short (0.4 s).
        val g = gUse
        val maxN = if (g != 0f) 60 else 24
        val maxT = if (g != 0f) 1_000_000_000L else 400_000_000L
        while (history.size > maxN || (history.size > 3 && t - history.first().t > maxT)) history.removeFirst()
        fitX = b.cx; fitY = b.cy
        val n = history.size
        if (n >= 3) {
            // Least-squares line through all samples (gravity's known curve removed from y first).
            var st = 0.0; var stt = 0.0; var sx = 0.0; var stx = 0.0; var sy = 0.0; var sty = 0.0
            for (s in history) {
                val tt = (s.t - t) / 1e9
                val yy = s.y - 0.5 * g * tt * tt
                st += tt; stt += tt * tt; sx += s.x; stx += tt * s.x; sy += yy; sty += tt * yy
            }
            val den = n * stt - st * st
            if (den > 1e-9) {
                vx = ((n * stx - st * sx) / den).toFloat()
                vy = ((n * sty - st * sy) / den).toFloat()
                fitX = ((sx - vx * st) / n).toFloat()   // line's value at the latest time
                fitY = ((sy - vy * st) / n).toFloat()
            }
        } else if (n == 2) {
            val a = history.first()
            val dt = (t - a.t) / 1e9f
            if (dt > 0.005f) {
                vx = (b.cx - a.x) / dt
                vy = (b.cy - a.y) / dt + 0.5f * g * dt
            }
        }
        // Right after a paddle hit, blend the learned launch with the first few measured frames.
        launchEst?.let { est ->
            // Trust each side by its accuracy: the measured speed's error shrinks as frames add up
            // (straight-line fit through n points), the learned rule's error is what it usually misses by.
            val w = if (n < 2) 1f else {
                val dtF = if (n >= 2) ((t - history.first().t) / 1e9f) / (n - 1) else 1f / 60f
                val sigmaX = noise * 0.24f
                val spread = sqrt(n * (n * n - 1) / 12f)
                val sigmaMeas = sigmaX / (dtF.coerceAtLeast(0.004f) * spread)
                val sigmaModel = learner.launchSigma(sqrt(est.first * est.first + est.second * est.second))
                sigmaMeas * sigmaMeas / (sigmaMeas * sigmaMeas + sigmaModel * sigmaModel)
            }
            if (w > 0.05f) {
                vx = est.first * w + vx * (1f - w)
                vy = est.second * w + vy * (1f - w)
            } else launchEst = null
        }
        if (sincePaddleHit >= 0 && !(bouncedX || bouncedY)) {
            sincePaddleHit++
            if (n >= 6) { learner.onLaunchMeasured(vx, vy); sincePaddleHit = -1 }
        }
        val minSpeed = screenH * 0.02f
        if (abs(vx) > minSpeed) vxSign = if (vx > 0) 1 else -1
        if (abs(vy) > minSpeed) vySign = if (vy > 0) 1 else -1
        if (vySign < 0) awaitingLanding = true
    }

    /** Landing x and seconds until landing (measured from the frame's time). */
    private fun predict(b: Blob): Pair<Float?, Float?> {
        val py = paddleY
        if (py <= 0) return null to null
        val lo = (leftWall ?: 0f) + b.halfW
        val hi = (rightWall ?: screenW) - b.halfW
        val landY = py - b.halfH
        val ceil = (topWall ?: 0f) + b.halfH
        val minSpeed = screenH * 0.02f
        val g = gUse
        val t = if (g > 0f) {
            timeToLandWithGravity(fitY, vy, g, landY, ceil)
        } else when {
            vy > minSpeed -> (landY - fitY) / vy
            vy < -minSpeed -> ((fitY - ceil) + (landY - ceil)) / -vy
            // Barely moving vertically: just stay under where it is right now.
            else -> return fold(fitX + vx * leadSec, lo, hi) to null
        }
        if (t < 0f) return fold(fitX + vx * leadSec, lo, hi) to 0f
        val n = history.size
        // Too early in a flight to know the path? A proven repeating pattern can fill in.
        if (n < 3 && launchEst == null) learner.sequenceGuess()?.let { return it to t }
        val unfolded = fitX + vx * t
        val raw = fold(unfolded, lo, hi)
        val bounces = foldBounces(unfolded, lo, hi)
        val corrected = (raw + learner.correction(t, bounces)).coerceIn(lo, hi)
        if (n >= 4) learner.onPrediction(raw, corrected, t, bounces)
        return corrected to t
    }

    /** Falling arc: time to come down to [landY], bouncing off the ceiling if the arc reaches it. */
    private fun timeToLandWithGravity(y0In: Float, vyIn: Float, g: Float, landY: Float, ceil: Float): Float {
        var y0 = y0In; var v = vyIn; var total = 0f
        repeat(3) {
            if (v < 0f && y0 - v * v / (2f * g) < ceil) {
                // reaches the ceiling first
                val d = v * v - 2f * g * (y0 - ceil)
                val tc = ((-v - sqrt(max(0f, d))) / g).coerceAtLeast(0f)
                total += tc
                v = -(v + g * tc)
                y0 = ceil
            } else {
                val d = v * v + 2f * g * (landY - y0)
                return total + ((-v + sqrt(max(0f, d))) / g)
            }
        }
        return total
    }

    /** At the end of a flight segment, measure its curve and update the learned gravity. */
    private fun learnGravity() {
        val n = history.size
        if (n < 15) return
        val tEnd = history.last().t
        if ((tEnd - history.first().t) < 200_000_000L) return
        // Free quadratic fit y = a + b*t + c*t^2 (normal equations, Cramer's rule).
        var s0 = 0.0; var s1 = 0.0; var s2 = 0.0; var s3 = 0.0; var s4 = 0.0
        var y0 = 0.0; var y1 = 0.0; var y2 = 0.0
        for (s in history) {
            val tt = (s.t - tEnd) / 1e9
            val t2 = tt * tt
            s0 += 1; s1 += tt; s2 += t2; s3 += t2 * tt; s4 += t2 * t2
            y0 += s.y; y1 += tt * s.y; y2 += t2 * s.y
        }
        fun det(a: Double, b: Double, c: Double, d: Double, e: Double, f: Double, g: Double, h: Double, i: Double) =
            a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
        val dd = det(s0, s1, s2, s1, s2, s3, s2, s3, s4)
        if (abs(dd) < 1e-12) return
        val c = det(s0, s1, y0, s1, s2, y1, s2, s3, y2) / dd
        val est = (2 * c).toFloat()
        if (abs(est) > screenH * 10f) return   // nonsense
        gravity = (gravity * gravityWeight + est) / (gravityWeight + 1f)
        gravityWeight = min(20f, gravityWeight + 1f)
    }

    /** Number of same-coloured blobs seen in the last shark search. */
    private var candidateCount = 0

    /**
     * Connected blob of [color] between frame rows [rowStart, rowEnd): the one nearest
     * ([preferX], [preferY]) if given (among reasonably big ones), otherwise the largest.
     */
    fun detect(
        f: Frame, color: Int, rowStart: Int, rowEnd: Int,
        preferX: Float = -1f, preferY: Float = -1f,
        maxHalfW: Float = Float.MAX_VALUE, avoidStatic: Boolean = false,
    ): Blob? {
        val w = f.width
        val n = w * f.height
        if (mask.size < n) {
            mask = BooleanArray(n); seen = BooleanArray(n); queue = IntArray(n)
        }
        val tr = (color shr 16) and 0xFF
        val tg = (color shr 8) and 0xFF
        val tb = color and 0xFF
        val tol2 = tolerance * tolerance
        val ex = exclude
        val exL = (ex[0] / f.scaleX).toInt(); val exR = (ex[2] / f.scaleX).toInt() + 1
        val exT = (ex[1] / f.scaleY).toInt(); val exB = (ex[3] / f.scaleY).toInt() + 1
        val hasEx = ex[2] > ex[0] && ex[3] > ex[1]
        val px = f.rgba

        for (y in rowStart until rowEnd) {
            val rowEx = hasEx && y in exT until exB
            var i = y * w
            var j = i * 4
            for (x in 0 until w) {
                val dr = (px[j].toInt() and 0xFF) - tr
                val dg = (px[j + 1].toInt() and 0xFF) - tg
                val db = (px[j + 2].toInt() and 0xFF) - tb
                mask[i] = dr * dr + dg * dg + db * db <= tol2 && !(rowEx && x in exL until exR)
                seen[i] = false
                i++; j += 4
            }
        }

        val found = ArrayList<IntArray>()   // [count, minX, maxX, minY, maxY]
        for (start in rowStart * w until rowEnd * w) {
            if (!mask[start] || seen[start]) continue
            var head = 0; var tail = 0
            queue[tail++] = start; seen[start] = true
            var count = 0
            var minX = w; var maxX = 0; var minY = Int.MAX_VALUE; var maxY = 0
            while (head < tail) {
                val p = queue[head++]
                val x = p % w; val y = p / w
                count++
                if (x < minX) minX = x; if (x > maxX) maxX = x
                if (y < minY) minY = y; if (y > maxY) maxY = y
                if (x > 0) { val q = p - 1; if (mask[q] && !seen[q]) { seen[q] = true; queue[tail++] = q } }
                if (x < w - 1) { val q = p + 1; if (mask[q] && !seen[q]) { seen[q] = true; queue[tail++] = q } }
                if (y > rowStart) { val q = p - w; if (mask[q] && !seen[q]) { seen[q] = true; queue[tail++] = q } }
                if (y < rowEnd - 1) { val q = p + w; if (mask[q] && !seen[q]) { seen[q] = true; queue[tail++] = q } }
            }
            if (count >= 5) found.add(intArrayOf(count, minX, maxX, minY, maxY))
        }
        fun blobOf(c: IntArray) = Blob(
            cx = (c[1] + c[2] + 1) / 2f * f.scaleX,
            cy = (c[3] + c[4] + 1) / 2f * f.scaleY,
            halfW = (c[2] - c[1] + 1) / 2f * f.scaleX,
            halfH = (c[4] - c[3] + 1) / 2f * f.scaleY,
            pixels = c[0],
        )
        var blobs = found.map { blobOf(it) }.filter { it.halfW <= maxHalfW }
        if (avoidStatic) {
            candidateCount = blobs.size
            if (blobs.size > 1 && staticSpots.isNotEmpty()) {
                val moving = blobs.filter { b ->
                    staticSpots.none { s -> abs(b.cx - s[0]) < b.halfW && abs(b.cy - s[1]) < b.halfH }
                }
                if (moving.isNotEmpty()) blobs = moving
            }
        }
        if (blobs.isEmpty()) return null
        val largest = blobs.maxBy { it.pixels }
        if (preferX < 0f) return largest
        return blobs.filter { it.pixels >= largest.pixels * 0.3f }
            .minBy { (it.cx - preferX) * (it.cx - preferX) + (it.cy - preferY) * (it.cy - preferY) }
    }

    companion object {
        /** Mirror [x] back and forth inside [lo, hi], exactly like repeated wall bounces. */
        fun fold(x: Float, lo: Float, hi: Float): Float {
            val span = hi - lo
            if (span <= 0f) return (lo + hi) / 2f
            var u = (x - lo) % (2 * span)
            if (u < 0) u += 2 * span
            if (u > span) u = 2 * span - u
            return lo + u
        }

        /** Median colour of the 3x3 frame pixels around a screen point, as 0xRRGGBB. */
        fun sampleColor(f: Frame, screenX: Float, screenY: Float): Int {
            val cx = (screenX / f.scaleX).toInt().coerceIn(0, f.width - 1)
            val cy = (screenY / f.scaleY).toInt().coerceIn(0, f.height - 1)
            val rs = ArrayList<Int>(); val gs = ArrayList<Int>(); val bs = ArrayList<Int>()
            for (y in max(0, cy - 1)..min(f.height - 1, cy + 1)) {
                for (x in max(0, cx - 1)..min(f.width - 1, cx + 1)) {
                    val j = (y * f.width + x) * 4
                    rs.add(f.rgba[j].toInt() and 0xFF)
                    gs.add(f.rgba[j + 1].toInt() and 0xFF)
                    bs.add(f.rgba[j + 2].toInt() and 0xFF)
                }
            }
            rs.sort(); gs.sort(); bs.sort()
            val m = rs.size / 2
            return (rs[m] shl 16) or (gs[m] shl 8) or bs[m]
        }
    }
}
