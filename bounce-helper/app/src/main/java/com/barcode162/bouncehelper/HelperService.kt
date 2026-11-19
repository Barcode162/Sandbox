package com.barcode162.bouncehelper

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import java.nio.ByteBuffer
import kotlin.math.abs

/**
 * The accessibility service: owns the floating tool strip, the tracking markers, the
 * "tap the shark / tap the paddle" picker, and the virtual finger that holds the paddle.
 */
class HelperService : AccessibilityService() {

    companion object {
        @Volatile var instance: HelperService? = null
        private const val SEGMENT_MS = 20L
    }

    private val main = Handler(Looper.getMainLooper())
    private lateinit var wm: WindowManager
    private val dp get() = resources.displayMetrics.density

    // ---- Views ----
    private var strip: LinearLayout? = null
    private var stripParams: WindowManager.LayoutParams? = null
    private var tools: LinearLayout? = null
    private var autoBtn: TextView? = null
    private var eyeBtn: TextView? = null
    private var trackView: TrackingView? = null
    private var pickerView: View? = null
    private var lastResult: TrackResult? = null

    // ---- Virtual finger ----
    private var stroke: GestureDescription.StrokeDescription? = null
    private var holding = false
    private var fingerX = 0f
    private var targetX = -1f          // smoothed place the finger should go
    private var timeToLand = 1f        // seconds until the shark reaches the paddle
    private var stillSince = 0L
    private var paddleOffset = 0f   // detected paddle x minus finger x (for drag-relative games)

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        Engine.load(this)
        if (Engine.isEnabled(this)) showStrip()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        teardown()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        teardown()
        super.onDestroy()
    }

    private fun teardown() {
        Engine.autoOn = false
        hideStrip()
        instance = null
    }

    // =====================================================================
    // Floating strip
    // =====================================================================

    private fun overlayParams(w: Int, h: Int, flags: Int) = WindowManager.LayoutParams(
        w, h, WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        flags or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
        PixelFormat.TRANSLUCENT
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }

    fun showStrip() {
        if (strip != null) return
        showTrackingView()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GradientDrawable().apply {
                cornerRadius = 26 * dp
                setColor(Color.argb(230, 22, 30, 40))
                setStroke((1.5f * dp).toInt(), Color.argb(200, 255, 179, 0))
            }
            setPadding((6 * dp).toInt(), (4 * dp).toInt(), (6 * dp).toInt(), (4 * dp).toInt())
        }
        val handle = TextView(this).apply {
            text = "🦈"
            textSize = 26f
            setPadding((6 * dp).toInt(), 0, (6 * dp).toInt(), 0)
        }
        root.addView(handle)

        val t = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; visibility = View.GONE }
        autoBtn = pill("▶ Auto") { toggleAuto() }.also { t.addView(it) }
        t.addView(pill("🎯 Shark") { startPicker(true) })
        t.addView(pill("▬ Paddle") { startPicker(false) })
        eyeBtn = pill("👁") { toggleTracking() }.also { t.addView(it) }
        t.addView(pill("⏻") { turnOff() })
        root.addView(t)
        tools = t

        val params = overlayParams(
            WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        ).apply {
            x = 0
            y = (resources.displayMetrics.heightPixels * 0.3f).toInt()
        }
        attachDrag(handle, root, params)
        root.viewTreeObserver.addOnGlobalLayoutListener { updateExclude() }
        wm.addView(root, params)
        strip = root
        stripParams = params
        refreshButtons()
    }

    fun hideStrip() {
        stopHold()
        listOfNotNull(strip, trackView, pickerView).forEach { v ->
            try { wm.removeView(v) } catch (_: Exception) {}
        }
        strip = null; trackView = null; pickerView = null
        tools = null; autoBtn = null; eyeBtn = null
        Engine.tracker.exclude = floatArrayOf(0f, 0f, 0f, 0f)
    }

    private fun pill(label: String, onClick: () -> Unit) = TextView(this).apply {
        text = label
        textSize = 15f
        setTextColor(Color.WHITE)
        typeface = Typeface.DEFAULT_BOLD
        gravity = Gravity.CENTER
        setPadding((12 * dp).toInt(), (9 * dp).toInt(), (12 * dp).toInt(), (9 * dp).toInt())
        background = GradientDrawable().apply {
            cornerRadius = 20 * dp
            setColor(Color.argb(255, 50, 64, 80))
        }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { marginStart = (5 * dp).toInt() }
        setOnClickListener { onClick() }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun attachDrag(handle: View, root: View, params: WindowManager.LayoutParams) {
        var downX = 0f; var downY = 0f; var startX = 0; var startY = 0; var moved = false
        handle.setOnTouchListener { _, e ->
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = e.rawX; downY = e.rawY; startX = params.x; startY = params.y; moved = false
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - downX; val dy = e.rawY - downY
                    if (abs(dx) > 8 * dp || abs(dy) > 8 * dp) moved = true
                    if (moved) {
                        params.x = (startX + dx).toInt()
                        params.y = (startY + dy).toInt()
                        try { wm.updateViewLayout(root, params) } catch (_: Exception) {}
                    }
                }
                MotionEvent.ACTION_UP -> if (!moved) {
                    tools?.let { it.visibility = if (it.visibility == View.VISIBLE) View.GONE else View.VISIBLE }
                }
            }
            true
        }
    }

    /** Tell the tracker to ignore the strip's own pixels. */
    private fun updateExclude() {
        val s = strip ?: return
        val loc = IntArray(2)
        s.getLocationOnScreen(loc)
        Engine.tracker.exclude = floatArrayOf(
            loc[0].toFloat(), loc[1].toFloat(), (loc[0] + s.width).toFloat(), (loc[1] + s.height).toFloat()
        )
    }

    private fun refreshButtons() {
        autoBtn?.apply {
            text = if (Engine.autoOn) "■ Stop" else "▶ Auto"
            (background as GradientDrawable).setColor(
                if (Engine.autoOn) Color.rgb(220, 60, 60) else Color.rgb(40, 150, 80)
            )
        }
        eyeBtn?.alpha = if (Engine.showTracking) 1f else 0.45f
        trackView?.visibility = if (Engine.showTracking) View.VISIBLE else View.GONE
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    // =====================================================================
    // Strip actions
    // =====================================================================

    private fun needCapture(): Boolean {
        if (Engine.captureRunning) return false
        toast("Allow screen sharing first")
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                .putExtra(MainActivity.EXTRA_ACTIVATE, true)
        )
        return true
    }

    private fun toggleAuto() {
        if (Engine.autoOn) {
            Engine.autoOn = false
            stopHold()
        } else {
            if (needCapture()) return
            when {
                Engine.tracker.sharkColor < 0 -> { toast("Tap 🎯 Shark first"); return }
                Engine.tracker.paddleY < 0 -> { toast("Tap ▬ Paddle first"); return }
            }
            Engine.autoOn = true
            targetX = -1f
            startHold()
        }
        refreshButtons()
    }

    private fun toggleTracking() {
        Engine.showTracking = !Engine.showTracking
        Engine.save(this)
        refreshButtons()
    }

    private fun turnOff() {
        Engine.autoOn = false
        Engine.setEnabled(this, false)
        CaptureService.stop(this)
        hideStrip()
        toast("Bounce Helper off. Open the app to turn it back on.")
    }

    fun onCaptureChanged() = main.post {
        if (!Engine.captureRunning) {
            Engine.autoOn = false
            stopHold()
        }
        refreshButtons()
    }

    // =====================================================================
    // Tracking results -> finger target
    // =====================================================================

    fun onTrack(r: TrackResult) {
        lastResult = r
        if (Engine.showTracking) trackView?.invalidate()
        if (!Engine.autoOn) return
        r.landingX?.let { raw ->
            val want = raw - paddleOffset
            // Smooth small wobbles; accept big jumps (a new bounce) immediately.
            targetX = if (targetX < 0 || abs(want - targetX) > Engine.tracker.screenW * 0.08f) want
            else targetX + (want - targetX) * 0.4f
        }
        timeToLand = r.timeToLand ?: 1f
        // Learn how far the paddle sits from our finger (matters for games that drag relatively).
        val p = r.paddle
        val now = SystemClock.uptimeMillis()
        if (p != null && holding && now - stillSince > 150) {
            val measured = p.cx - fingerX
            paddleOffset = if (abs(measured) < Engine.tracker.screenW * 0.4f) paddleOffset * 0.8f + measured * 0.2f else paddleOffset
        }
    }

    // =====================================================================
    // Virtual finger (continuous gesture, Android 8+)
    // =====================================================================

    private fun clampX(x: Float) = x.coerceIn(2f, Engine.tracker.screenW.coerceAtLeast(10f) - 3f)

    private fun startHold() {
        if (!Engine.autoOn || holding) return
        val y = Engine.tracker.paddleY
        if (y < 0) return
        fingerX = clampX(if (targetX >= 0) targetX else if (Engine.paddleX >= 0) Engine.paddleX else Engine.tracker.screenW / 2)
        paddleOffset = 0f
        val path = Path().apply { moveTo(fingerX, y); lineTo(fingerX + 1, y) }
        fingerX += 1
        stillSince = SystemClock.uptimeMillis()
        holding = send(GestureDescription.StrokeDescription(path, 0, SEGMENT_MS, true))
    }

    private fun stopHold() {
        // The next completed segment sees autoOn == false and lifts the finger.
        if (!Engine.autoOn && !holding) stroke = null
    }

    private fun send(s: GestureDescription.StrokeDescription): Boolean {
        stroke = s
        return try {
            dispatchGesture(GestureDescription.Builder().addStroke(s).build(), gestureCallback, main)
        } catch (e: Exception) {
            false
        }
    }

    private val gestureCallback = object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
            val s = stroke
            if (s == null || !s.willContinue()) { holding = false; stroke = null; return }
            val y = Engine.tracker.paddleY
            if (!Engine.autoOn || y < 0) {
                // Lift the finger.
                val path = Path().apply { moveTo(fingerX, y.coerceAtLeast(0f)); lineTo(fingerX - 1, y.coerceAtLeast(0f)) }
                fingerX -= 1
                send(s.continueStroke(path, 0, SEGMENT_MS, false))
                return
            }
            val goal = clampX(if (targetX >= 0) targetX else fingerX)
            val err = goal - fingerX
            val w = Engine.tracker.screenW
            var nx = fingerX
            // Dead zone: if we're already close enough, hold perfectly still.
            if (abs(err) > w * 0.006f) {
                // Glide toward the goal: gentle when there's time, fast when the shark is about to land.
                val rate = (3.5f / timeToLand.coerceAtLeast(0.05f)).coerceIn(14f, 80f)
                val step = err * (1f - kotlin.math.exp(-rate * SEGMENT_MS / 1000f))
                nx = clampX(fingerX + step)
                stillSince = SystemClock.uptimeMillis()
            }
            // A zero-length segment is fine: the finger just stays down in place.
            val path = Path().apply { moveTo(fingerX, y); lineTo(nx, y) }
            fingerX = nx
            if (!send(s.continueStroke(path, 0, SEGMENT_MS, true))) holding = false
        }

        override fun onCancelled(gestureDescription: GestureDescription?) {
            // Usually a real touch interrupted us. Re-grab shortly if still on.
            holding = false
            stroke = null
            if (Engine.autoOn) main.postDelayed({ startHold() }, 400)
        }
    }

    // =====================================================================
    // Picker: freeze the screen, user taps the shark or the paddle
    // =====================================================================

    private fun startPicker(shark: Boolean) {
        if (needCapture()) return
        val frame = Engine.snapshot() ?: run { toast("No screen image yet, try again in a second"); return }
        if (Engine.autoOn) { Engine.autoOn = false; stopHold(); refreshButtons() }
        pickerView?.let { try { wm.removeView(it) } catch (_: Exception) {} }
        val v = PickerView(this, frame, shark)
        pickerView = v
        wm.addView(v, overlayParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        ))
    }

    private fun closePicker() {
        pickerView?.let { try { wm.removeView(it) } catch (_: Exception) {} }
        pickerView = null
    }

    private fun onPicked(frame: Frame, shark: Boolean, x: Float, y: Float) {
        closePicker()
        val color = Tracker.sampleColor(frame, x, y)
        val t = Engine.tracker
        if (shark) {
            t.sharkColor = color
            t.resetMotion()
            val blob = t.detect(frame, color, 0, frame.height)
            toast(if (blob != null) "Shark locked 🎯 Now tap ▬ Paddle" else "Saved, but couldn't find it. Try tapping its middle.")
        } else {
            t.paddleColor = color
            t.paddleY = y
            Engine.paddleX = x
            t.resetWalls()
            toast("Paddle saved ▬ Now tap ▶ Auto")
        }
        Engine.save(this)
        trackView?.invalidate()
    }

    @SuppressLint("ViewConstructor")
    private inner class PickerView(ctx: Context, val frame: Frame, val shark: Boolean) : View(ctx) {
        private val bmp: Bitmap = Bitmap.createBitmap(frame.width, frame.height, Bitmap.Config.ARGB_8888).also {
            val bytes = frame.rgba.copyOf()
            var i = 3
            while (i < bytes.size) { bytes[i] = 0xFF.toByte(); i += 4 }
            it.copyPixelsFromBuffer(ByteBuffer.wrap(bytes))
        }
        private val paint = Paint(Paint.FILTER_BITMAP_FLAG)
        private val banner = Paint().apply { color = Color.argb(220, 0, 0, 0) }
        private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE; textSize = 20 * dp; typeface = Typeface.DEFAULT_BOLD; textAlign = Paint.Align.CENTER
        }
        private val cancelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(200, 60, 60) }
        private val cancelRect = RectF()
        private val dst = RectF()
        private val loc = IntArray(2)

        override fun onDraw(c: Canvas) {
            getLocationOnScreen(loc)
            dst.set(-loc[0].toFloat(), -loc[1].toFloat(), Engine.tracker.screenW - loc[0], Engine.tracker.screenH - loc[1])
            c.drawBitmap(bmp, null, dst, paint)
            val top = 40 * dp
            c.drawRect(0f, top, width.toFloat(), top + 96 * dp, banner)
            c.drawText(if (shark) "Tap the middle of the SHARK" else "Tap the middle of the PADDLE",
                width / 2f, top + 34 * dp, text)
            cancelRect.set(width / 2f - 60 * dp, top + 50 * dp, width / 2f + 60 * dp, top + 86 * dp)
            c.drawRoundRect(cancelRect, 18 * dp, 18 * dp, cancelPaint)
            text.textSize = 16 * dp
            c.drawText("Cancel", cancelRect.centerX(), cancelRect.centerY() + 6 * dp, text)
            text.textSize = 20 * dp
        }

        @SuppressLint("ClickableViewAccessibility")
        override fun onTouchEvent(e: MotionEvent): Boolean {
            if (e.actionMasked == MotionEvent.ACTION_UP) {
                if (cancelRect.contains(e.x, e.y)) closePicker()
                else onPicked(frame, shark, e.rawX, e.rawY)
            }
            return true
        }
    }

    // =====================================================================
    // Tracking markers (not touchable; drawn below the paddle line so they don't confuse tracking)
    // =====================================================================

    private fun showTrackingView() {
        if (trackView != null) return
        val v = TrackingView(this)
        trackView = v
        wm.addView(v, overlayParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        ))
        v.visibility = if (Engine.showTracking) View.VISIBLE else View.GONE
    }

    private inner class TrackingView(ctx: Context) : View(ctx) {
        private val dot = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.rgb(255, 0, 200) }
        private val line = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(200, 255, 220, 0); strokeWidth = 2 * dp
        }
        private val label = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE; textSize = 13 * dp; textAlign = Paint.Align.CENTER; typeface = Typeface.DEFAULT_BOLD
        }
        private val labelBg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(170, 0, 0, 0) }
        private val tri = Path()
        private val loc = IntArray(2)

        override fun onDraw(c: Canvas) {
            getLocationOnScreen(loc)
            val ox = -loc[0].toFloat(); val oy = -loc[1].toFloat()
            val t = Engine.tracker
            val r = lastResult
            val py = t.paddleY

            if (py > 0) {
                val my = py + oy + 26 * dp
                // short yellow ticks at both edges show the saved paddle line
                c.drawLine(0f, my, 24 * dp, my, line)
                c.drawLine(width - 24 * dp, my, width.toFloat(), my, line)
                r?.landingX?.let { lx ->
                    val x = lx + ox
                    tri.reset()
                    tri.moveTo(x, my - 12 * dp); tri.lineTo(x - 10 * dp, my + 6 * dp); tri.lineTo(x + 10 * dp, my + 6 * dp); tri.close()
                    c.drawPath(tri, dot)
                }
            }
            // tiny dot on the shark's centre (small enough to be ignored by the tracker)
            r?.shark?.let { c.drawCircle(r.nowX + ox, r.nowY + oy, 3 * dp, dot) }

            val delay = "${(Engine.captureDelayMs + Engine.extraLeadMs).toInt()} ms lead"
            val status = when {
                !Engine.captureRunning -> "Helper paused: screen sharing off"
                t.sharkColor < 0 -> "Tap 🦈 → 🎯 Shark"
                t.paddleY < 0 -> "Tap 🦈 → ▬ Paddle"
                r?.shark == null -> "Looking for the shark…"
                Engine.autoOn -> "AUTO ON · tracking ✓ · $delay"
                else -> "Tracking ✓ · $delay · tap ▶ Auto"
            }
            val ty = height - 28 * dp
            val tw = label.measureText(status) / 2 + 12 * dp
            c.drawRoundRect(width / 2f - tw, ty - 18 * dp, width / 2f + tw, ty + 8 * dp, 12 * dp, 12 * dp, labelBg)
            c.drawText(status, width / 2f, ty, label)
        }
    }
}
