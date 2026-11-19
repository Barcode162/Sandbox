package com.barcode162.bouncehelper

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

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

    // ---- Learned play-area edges (screen px) ----
    var leftWall: Float? = null; private set
    var rightWall: Float? = null; private set
    var topWall: Float? = null; private set

    private class Sample(val t: Long, val x: Float, val y: Float)
    private val history = ArrayDeque<Sample>()
    private var vx = 0f
    private var vy = 0f
    private var vxSign = 0
    private var vySign = 0
    private var lastSeen = 0L

    private var mask = BooleanArray(0)
    private var seen = BooleanArray(0)
    private var queue = IntArray(0)

    fun resetMotion() {
        history.clear()
        vx = 0f; vy = 0f; vxSign = 0; vySign = 0
    }

    fun resetWalls() {
        leftWall = null; rightWall = null; topWall = null
    }

    fun process(f: Frame, tNanos: Long): TrackResult {
        val py = paddleY
        val sharkRowEnd = if (py > 0) min(f.height, (py / f.scaleY).toInt() + 1) else f.height
        val shark = if (sharkColor >= 0) detect(f, sharkColor, 0, sharkRowEnd) else null

        var paddle: Blob? = null
        if (paddleColor >= 0 && py > 0) {
            val band = (screenH * 0.04f / f.scaleY).toInt() + 2
            val row = (py / f.scaleY).toInt()
            paddle = detect(f, paddleColor, max(0, row - band), min(f.height, row + band))
        }

        if (shark == null) {
            if (tNanos - lastSeen > 300_000_000L) resetMotion()
            return TrackResult(null, paddle, 0f, 0f, null)
        }
        lastSeen = tNanos
        addSample(tNanos, shark, 2.5f * max(f.scaleX, f.scaleY))
        return TrackResult(shark, paddle, vx, vy, predict(shark))
    }

    private fun addSample(t: Long, b: Blob, noise: Float) {
        var bouncedX = false
        var bouncedY = false
        history.lastOrNull()?.let { p ->
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
            if (vySign != 0 && dy * vySign < -noise) {
                bouncedY = true
                // Only a bounce in the upper part of the screen is the ceiling (lower = paddle).
                if (vySign < 0 && paddleY > 0 && b.cy < paddleY * 0.6f) {
                    val wall = (p.y + b.cy - abs(vy) * dt) / 2f - b.halfH
                    topWall = max(0f, min(topWall ?: screenH, wall))
                }
            }
        }
        if (bouncedX || bouncedY) {
            history.clear()
            if (bouncedX) vx = -vx
            if (bouncedY) vy = -vy
        }
        history.addLast(Sample(t, b.cx, b.cy))
        while (history.size > 2 && t - history.first().t > 250_000_000L) history.removeFirst()
        if (history.size >= 2) {
            val a = history.first()
            val dt = (t - a.t) / 1e9f
            if (dt > 0.02f) {
                vx = (b.cx - a.x) / dt
                vy = (b.cy - a.y) / dt
            }
        }
        val minSpeed = screenH * 0.02f
        if (abs(vx) > minSpeed) vxSign = if (vx > 0) 1 else -1
        if (abs(vy) > minSpeed) vySign = if (vy > 0) 1 else -1
    }

    private fun predict(b: Blob): Float? {
        val py = paddleY
        if (py <= 0) return null
        val lo = (leftWall ?: 0f) + b.halfW
        val hi = (rightWall ?: screenW) - b.halfW
        val landY = py - b.halfH
        val ceil = (topWall ?: 0f) + b.halfH
        val minSpeed = screenH * 0.02f
        val t = when {
            vy > minSpeed -> (landY - b.cy) / vy
            vy < -minSpeed -> ((b.cy - ceil) + (landY - ceil)) / -vy
            else -> return b.cx
        }
        if (t < 0f) return b.cx
        return fold(b.cx + vx * t, lo, hi)
    }

    /** Largest connected blob of [color] between frame rows [rowStart, rowEnd). */
    fun detect(f: Frame, color: Int, rowStart: Int, rowEnd: Int): Blob? {
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

        var bestCount = 0
        var bMinX = 0; var bMaxX = 0; var bMinY = 0; var bMaxY = 0
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
            if (count > bestCount) {
                bestCount = count; bMinX = minX; bMaxX = maxX; bMinY = minY; bMaxY = maxY
            }
        }
        if (bestCount < 5) return null
        return Blob(
            cx = (bMinX + bMaxX + 1) / 2f * f.scaleX,
            cy = (bMinY + bMaxY + 1) / 2f * f.scaleY,
            halfW = (bMaxX - bMinX + 1) / 2f * f.scaleX,
            halfH = (bMaxY - bMinY + 1) / 2f * f.scaleY,
            pixels = bestCount,
        )
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
