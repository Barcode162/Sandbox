package com.barcode162.sharkbounce

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * The whole game: a shark bounces around the screen like a pong ball (straight lines,
 * perfect reflections off the walls and ceiling). Drag the platform left/right so the
 * shark lands on it. Landing in the middle scores a PERFECT bonus.
 */
class GameView(context: Context) : View(context) {

    private enum class State { READY, PLAYING, GAME_OVER }

    private val dp = resources.displayMetrics.density
    private val prefs = context.getSharedPreferences("shark_bounce", Context.MODE_PRIVATE)

    // ---- Game state ----
    private var state = State.READY
    private var score = 0
    private var best = prefs.getInt("best", 0)
    private var perfectStreak = 0
    private var showHint = prefs.getBoolean("hint", false)
    private var running = true
    private var lastFrameNs = 0L
    private var time = 0f
    private var gameOverAt = 0f

    // ---- World geometry (pixels, set in onSizeChanged) ----
    private var w = 0f
    private var h = 0f
    private var topWall = 0f
    private var sharkR = 0f
    private var platY = 0f
    private var platH = 0f
    private var platW = 0f
    private var platX = 0f          // platform centre
    private var baseSpeed = 0f
    private var maxSpeed = 0f

    // ---- Shark ----
    private var sx = 0f
    private var sy = 0f
    private var vx = 0f
    private var vy = 0f
    private var speed = 0f
    private var facing = 1f         // 1 = facing right, -1 = facing left
    private var squash = 0f         // little squish animation on landing

    // ---- Touch ----
    private var dragOffset = 0f
    private var dragging = false
    private val hintButton = RectF()

    // ---- Effects ----
    private class Bubble(var x: Float, var y: Float, var r: Float, var v: Float)
    private class Popup(val text: String, val x: Float, var y: Float, var life: Float, val color: Int)
    private val bubbles = ArrayList<Bubble>()
    private val popups = ArrayList<Popup>()

    // ---- Paints ----
    private val bgPaint = Paint()
    private val sandPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(214, 190, 130) }
    private val bubblePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE; color = Color.argb(110, 255, 255, 255)
    }
    private val platPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(255, 179, 0) }
    private val platEdgePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(230, 120, 0) }
    private val platCenterPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(255, 245, 200) }
    private val sharkBody = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(120, 140, 158) }
    private val sharkBelly = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(236, 240, 243) }
    private val sharkDark = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(88, 106, 122) }
    private val eyePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(20, 24, 30) }
    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE; color = Color.rgb(60, 70, 80); strokeCap = Paint.Cap.ROUND
    }
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(70, 0, 0, 0) }
    private val hintPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE; color = Color.argb(150, 255, 255, 255)
    }
    private val hintMarkPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(140, 255, 255, 255) }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE; textAlign = Paint.Align.CENTER; typeface = Typeface.DEFAULT_BOLD
    }
    private val smallText = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(220, 255, 255, 255); textAlign = Paint.Align.CENTER
    }
    private val buttonPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val overlayPaint = Paint().apply { color = Color.argb(140, 0, 20, 40) }
    private val path = Path()

    init {
        isHapticFeedbackEnabled = true
    }

    // =====================================================================
    // Setup
    // =====================================================================

    override fun onSizeChanged(nw: Int, nh: Int, ow: Int, oh: Int) {
        w = nw.toFloat()
        h = nh.toFloat()
        topWall = 72 * dp
        sharkR = min(w * 0.065f, 34 * dp)
        platH = 16 * dp
        platY = h - 120 * dp
        baseSpeed = h * 0.55f
        maxSpeed = h * 1.5f
        platX = w / 2
        updatePlatformWidth()
        bgPaint.shader = LinearGradient(
            0f, 0f, 0f, h,
            intArrayOf(Color.rgb(30, 140, 200), Color.rgb(10, 70, 140), Color.rgb(4, 30, 70)),
            null, Shader.TileMode.CLAMP
        )
        textPaint.textSize = 40 * dp
        smallText.textSize = 16 * dp
        bubblePaint.strokeWidth = 1.5f * dp
        linePaint.strokeWidth = 1.6f * dp
        hintPaint.strokeWidth = 2 * dp
        hintPaint.pathEffect = DashPathEffect(floatArrayOf(6 * dp, 8 * dp), 0f)
        hintButton.set(w - 92 * dp, 18 * dp, w - 14 * dp, 54 * dp)
        bubbles.clear()
        repeat(18) { bubbles.add(newBubble(Random.nextFloat() * h)) }
        resetShark()
    }

    private fun newBubble(y: Float) =
        Bubble(Random.nextFloat() * w, y, (2 + Random.nextFloat() * 6) * dp, (20 + Random.nextFloat() * 40) * dp)

    private fun updatePlatformWidth() {
        // Platform slowly shrinks as the score climbs, down to a minimum.
        platW = w * max(0.20f, 0.32f - score * 0.002f)
    }

    private fun resetShark() {
        sx = w / 2
        sy = topWall + (platY - topWall) * 0.35f
        speed = baseSpeed
        // Start heading down at a 35° angle, random left or right.
        val dir = if (Random.nextBoolean()) 1f else -1f
        val angle = Math.toRadians(35.0)
        vx = (speed * sin(angle)).toFloat() * dir
        vy = (speed * kotlin.math.cos(angle)).toFloat()
        facing = dir
    }

    private fun startGame() {
        score = 0
        perfectStreak = 0
        popups.clear()
        updatePlatformWidth()
        resetShark()
        state = State.PLAYING
    }

    fun pause() {
        running = false
    }

    fun resume() {
        running = true
        lastFrameNs = 0L
        invalidate()
    }

    // =====================================================================
    // Game loop
    // =====================================================================

    override fun onDraw(canvas: Canvas) {
        val now = System.nanoTime()
        val dt = if (lastFrameNs == 0L) 0f else min((now - lastFrameNs) / 1e9f, 1f / 30f)
        lastFrameNs = now
        if (w > 0f) {
            update(dt)
            render(canvas)
        }
        if (running) postInvalidateOnAnimation()
    }

    private fun update(dt: Float) {
        time += dt
        squash = max(0f, squash - dt * 4f)

        for (b in bubbles) {
            b.y -= b.v * dt
            b.x += sin(time * 2 + b.r) * 6 * dp * dt
            if (b.y < topWall - b.r) {
                val nb = newBubble(h + b.r)
                b.x = nb.x; b.y = nb.y; b.r = nb.r; b.v = nb.v
            }
        }
        val it = popups.iterator()
        while (it.hasNext()) {
            val p = it.next()
            p.life -= dt
            p.y -= 40 * dp * dt
            if (p.life <= 0) it.remove()
        }

        if (state != State.PLAYING) return

        // Sub-step so a fast shark can never tunnel through the platform.
        val steps = max(1, (speed * dt / (sharkR * 0.5f)).toInt() + 1)
        val sub = dt / steps
        repeat(steps) {
            if (state == State.PLAYING) step(sub)
        }
    }

    private fun step(dt: Float) {
        val prevBottom = sy + sharkR
        sx += vx * dt
        sy += vy * dt

        // Side walls
        if (sx < sharkR) { sx = sharkR; vx = abs(vx) }
        if (sx > w - sharkR) { sx = w - sharkR; vx = -abs(vx) }
        // Ceiling
        if (sy < topWall + sharkR) { sy = topWall + sharkR; vy = abs(vy) }
        if (abs(vx) > 1f) facing = if (vx > 0) 1f else -1f

        // Platform
        val bottom = sy + sharkR
        if (vy > 0 && prevBottom <= platY && bottom >= platY) {
            val half = platW / 2
            val reach = half + sharkR * 0.6f
            val offset = sx - platX
            if (abs(offset) <= reach) {
                land(offset / half)
            }
        }

        // Missed: shark sinks off the bottom.
        if (sy - sharkR > h) gameOver()
    }

    private fun land(rawOffset: Float) {
        val offset = rawOffset.coerceIn(-1f, 1f)
        sy = platY - sharkR
        squash = 1f

        val perfect = abs(offset) < 0.22f
        val points = if (perfect) 2 else 1
        score += points
        if (perfect) perfectStreak++ else perfectStreak = 0

        popups.add(
            Popup(
                if (perfect) "PERFECT +2" else "+1",
                sx, sy - sharkR * 1.5f, 0.9f,
                if (perfect) Color.rgb(255, 235, 59) else Color.WHITE
            )
        )
        performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

        // Pong-style bounce: hitting off-centre nudges the shark's angle.
        speed = min(maxSpeed, speed * 1.03f)
        var nvx = vx + offset * speed * 0.45f
        var nvy = -abs(vy)
        val len = hypot(nvx, nvy)
        nvx = nvx / len * speed
        nvy = nvy / len * speed
        // Keep the shark from going too flat (it must always come back down reasonably).
        val minVy = speed * 0.55f
        if (abs(nvy) < minVy) {
            nvy = -minVy
            nvx = (if (nvx >= 0) 1f else -1f) * kotlin.math.sqrt(speed * speed - minVy * minVy)
        }
        vx = nvx
        vy = nvy
        updatePlatformWidth()
    }

    private fun gameOver() {
        state = State.GAME_OVER
        gameOverAt = time
        if (score > best) {
            best = score
            prefs.edit().putInt("best", best).apply()
        }
        performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
    }

    /** Where (x) the shark will cross the platform line, following its reflections. */
    private fun predictLanding(): Float? {
        var x = sx; var y = sy; var dx = vx; var dy = vy
        val minX = sharkR; val maxX = w - sharkR
        val minY = topWall + sharkR; val targetY = platY - sharkR
        repeat(40) {
            val tx = when {
                dx > 0 -> (maxX - x) / dx
                dx < 0 -> (minX - x) / dx
                else -> Float.MAX_VALUE
            }
            val ty = if (dy > 0) (targetY - y) / dy else (minY - y) / dy
            if (ty <= tx) {
                x += dx * ty; y += dy * ty
                if (dy > 0) return x
                dy = -dy
            } else {
                x += dx * tx; y += dy * tx
                dx = -dx
            }
        }
        return null
    }

    // =====================================================================
    // Drawing
    // =====================================================================

    private fun render(c: Canvas) {
        c.drawRect(0f, 0f, w, h, bgPaint)

        // Light rays
        shadowPaint.color = Color.argb(18, 255, 255, 255)
        for (i in 0 until 4) {
            val x0 = w * (0.1f + i * 0.28f) + sin(time * 0.3f + i) * 20 * dp
            path.reset()
            path.moveTo(x0, 0f); path.lineTo(x0 + 50 * dp, 0f)
            path.lineTo(x0 + 140 * dp, h); path.lineTo(x0 + 40 * dp, h); path.close()
            c.drawPath(path, shadowPaint)
        }
        shadowPaint.color = Color.argb(70, 0, 0, 0)

        for (b in bubbles) c.drawCircle(b.x, b.y, b.r, bubblePaint)

        // Sea floor
        path.reset()
        path.moveTo(0f, h)
        path.lineTo(0f, h - 34 * dp)
        path.quadTo(w * 0.25f, h - 50 * dp, w * 0.5f, h - 36 * dp)
        path.quadTo(w * 0.75f, h - 22 * dp, w, h - 40 * dp)
        path.lineTo(w, h); path.close()
        c.drawPath(path, sandPaint)

        if (state == State.PLAYING && showHint) drawHint(c)

        drawPlatform(c)
        drawShark(c)

        for (p in popups) {
            textPaint.color = p.color
            textPaint.alpha = (255 * min(1f, p.life * 2)).toInt()
            val old = textPaint.textSize
            textPaint.textSize = 22 * dp
            c.drawText(p.text, p.x.coerceIn(70 * dp, w - 70 * dp), p.y, textPaint)
            textPaint.textSize = old
        }
        textPaint.color = Color.WHITE
        textPaint.alpha = 255

        drawHud(c)

        when (state) {
            State.READY -> drawCenterMessage(c, "SHARK BOUNCE", "Drag the platform to catch the shark", "Tap to start")
            State.GAME_OVER -> drawCenterMessage(
                c, "GAME OVER",
                if (score >= best && score > 0) "New best: $score!" else "Score: $score   Best: $best",
                "Tap to play again"
            )
            State.PLAYING -> {}
        }
    }

    private fun drawHint(c: Canvas) {
        val lx = predictLanding() ?: return
        path.reset()
        path.moveTo(lx, platY - 4 * dp)
        path.lineTo(lx, platY - 60 * dp)
        c.drawPath(path, hintPaint)
        c.drawCircle(lx, platY - 4 * dp, 5 * dp, hintMarkPaint)
    }

    private fun drawPlatform(c: Canvas) {
        val l = platX - platW / 2
        val r = platX + platW / 2
        val rad = platH / 2
        // shadow
        c.drawRoundRect(l + 3 * dp, platY + 5 * dp, r + 3 * dp, platY + platH + 5 * dp, rad, rad, shadowPaint)
        c.drawRoundRect(l, platY, r, platY + platH, rad, rad, platEdgePaint)
        c.drawRoundRect(l, platY, r, platY + platH * 0.7f, rad, rad, platPaint)
        // centre "perfect" zone marker
        val zone = platW / 2 * 0.22f
        c.drawRoundRect(platX - zone, platY + platH * 0.2f, platX + zone, platY + platH * 0.5f,
            rad / 2, rad / 2, platCenterPaint)
    }

    private fun drawShark(c: Canvas) {
        val r = sharkR
        c.save()
        c.translate(sx, sy)
        // Point the shark along its direction of travel, keeping its belly downward.
        var ang = Math.toDegrees(atan2(vy.toDouble(), vx.toDouble())).toFloat()
        if (state == State.READY) ang = if (facing > 0) 20f else 160f
        c.rotate(ang)
        if (facing < 0) c.scale(1f, -1f)
        val sq = squash * 0.18f
        c.scale(1f + sq, 1f - sq)

        val L = r * 1.35f   // half length

        // Tail fin
        val wag = sin(time * 12f) * r * 0.12f
        path.reset()
        path.moveTo(-L * 0.80f, 0f)
        path.lineTo(-L * 1.35f, -r * 0.75f + wag)
        path.quadTo(-L * 1.10f, wag * 0.5f, -L * 1.30f, r * 0.60f + wag)
        path.close()
        c.drawPath(path, sharkDark)

        // Dorsal fin
        path.reset()
        path.moveTo(-L * 0.15f, -r * 0.50f)
        path.quadTo(-L * 0.05f, -r * 1.05f, -L * 0.30f, -r * 1.25f)
        path.quadTo(L * 0.05f, -r * 0.95f, L * 0.30f, -r * 0.45f)
        path.close()
        c.drawPath(path, sharkDark)

        // Body
        path.reset()
        path.moveTo(L, r * 0.05f)
        path.cubicTo(L * 0.85f, -r * 0.55f, L * 0.1f, -r * 0.70f, -L * 0.45f, -r * 0.40f)
        path.quadTo(-L * 0.75f, -r * 0.20f, -L * 0.90f, 0f)
        path.quadTo(-L * 0.75f, r * 0.25f, -L * 0.45f, r * 0.40f)
        path.cubicTo(L * 0.1f, r * 0.65f, L * 0.80f, r * 0.50f, L, r * 0.05f)
        path.close()
        c.drawPath(path, sharkBody)

        // Belly
        path.reset()
        path.moveTo(L * 0.92f, r * 0.15f)
        path.cubicTo(L * 0.6f, r * 0.30f, L * 0.0f, r * 0.15f, -L * 0.60f, r * 0.28f)
        path.cubicTo(-L * 0.1f, r * 0.62f, L * 0.70f, r * 0.50f, L * 0.92f, r * 0.15f)
        path.close()
        c.drawPath(path, sharkBelly)

        // Pectoral fin
        path.reset()
        path.moveTo(L * 0.25f, r * 0.30f)
        path.lineTo(-L * 0.05f, r * 0.85f)
        path.lineTo(L * 0.05f, r * 0.30f)
        path.close()
        c.drawPath(path, sharkDark)

        // Gills
        for (i in 0 until 3) {
            val gx = L * (0.38f - i * 0.09f)
            c.drawLine(gx, -r * 0.12f, gx - r * 0.06f, r * 0.18f, linePaint)
        }
        // Mouth
        path.reset()
        path.moveTo(L * 0.92f, r * 0.18f)
        path.quadTo(L * 0.75f, r * 0.30f, L * 0.58f, r * 0.20f)
        linePaint.style = Paint.Style.STROKE
        c.drawPath(path, linePaint)
        // Eye
        c.drawCircle(L * 0.68f, -r * 0.12f, r * 0.10f, eyePaint)
        c.drawCircle(L * 0.70f, -r * 0.15f, r * 0.035f, sharkBelly)

        c.restore()
    }

    private fun drawHud(c: Canvas) {
        overlayPaint.alpha = 90
        c.drawRect(0f, 0f, w, topWall, overlayPaint)
        overlayPaint.alpha = 140

        textPaint.textAlign = Paint.Align.LEFT
        textPaint.textSize = 30 * dp
        c.drawText("$score", 18 * dp, 48 * dp, textPaint)
        smallText.textAlign = Paint.Align.LEFT
        smallText.textSize = 13 * dp
        val streak = if (perfectStreak >= 2) "   Perfect x$perfectStreak" else ""
        c.drawText("BEST $best$streak", 18 * dp + textPaint.measureText("$score") + 14 * dp, 46 * dp, smallText)
        textPaint.textAlign = Paint.Align.CENTER
        smallText.textAlign = Paint.Align.CENTER
        textPaint.textSize = 40 * dp
        smallText.textSize = 16 * dp

        // Hint toggle
        buttonPaint.color = if (showHint) Color.argb(200, 255, 179, 0) else Color.argb(70, 255, 255, 255)
        c.drawRoundRect(hintButton, 10 * dp, 10 * dp, buttonPaint)
        smallText.textSize = 14 * dp
        c.drawText(if (showHint) "HINT ON" else "HINT", hintButton.centerX(), hintButton.centerY() + 5 * dp, smallText)
        smallText.textSize = 16 * dp
    }

    private fun drawCenterMessage(c: Canvas, title: String, sub: String, action: String) {
        c.drawRect(0f, topWall, w, h, overlayPaint)
        val cy = h * 0.42f
        textPaint.textSize = 42 * dp
        c.drawText(title, w / 2, cy, textPaint)
        smallText.textSize = 18 * dp
        c.drawText(sub, w / 2, cy + 40 * dp, smallText)
        val pulse = (180 + 75 * sin(time * 4)).toInt()
        smallText.alpha = pulse
        smallText.textSize = 20 * dp
        c.drawText(action, w / 2, cy + 90 * dp, smallText)
        smallText.alpha = 220
        smallText.textSize = 16 * dp
        textPaint.textSize = 40 * dp
    }

    // =====================================================================
    // Input
    // =====================================================================

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                if (hintButton.contains(e.x, e.y)) {
                    showHint = !showHint
                    prefs.edit().putBoolean("hint", showHint).apply()
                    dragging = false
                    return true
                }
                when (state) {
                    State.GAME_OVER -> if (time - gameOverAt < 0.7f) return true else {
                        startGame()
                        platX = e.x.coerceIn(platW / 2, w - platW / 2)
                    }
                    State.READY -> {
                        startGame()
                        platX = e.x.coerceIn(platW / 2, w - platW / 2)
                    }
                    State.PLAYING -> {}
                }
                // Drag relative to where the finger went down, so the platform never jumps.
                dragOffset = platX - e.x
                dragging = true
            }
            MotionEvent.ACTION_MOVE -> if (dragging && state == State.PLAYING) {
                platX = (e.x + dragOffset).coerceIn(platW / 2, w - platW / 2)
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> dragging = false
        }
        return true
    }
}
