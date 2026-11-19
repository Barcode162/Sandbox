package com.barcode162.bouncehelper

import android.content.Context
import android.graphics.Point
import android.hardware.display.DisplayManager
import android.view.Display

/** Shared state between the setup screen, the screen-capture service and the overlay service. */
object Engine {
    val tracker = Tracker()

    @Volatile var captureRunning = false
    @Volatile var autoOn = false
    @Volatile var showTracking = true
    @Volatile var paddleX = -1f
    /** Measured screen-to-helper delay of captured frames, in ms (updated live). */
    @Volatile var captureDelayMs = 30f
    /** Extra lead the user can add for the game's own touch delay, in ms. */
    @Volatile var extraLeadMs = 50

    /** Total delay to make up for: captured-frame delay + finger/game reaction delay. */
    fun updateLead() {
        tracker.leadSec = (captureDelayMs + extraLeadMs) / 1000f
    }

    val frameLock = Any()
    /** Latest captured frame. Its buffer is reused: copy it (under [frameLock]) before keeping it. */
    var latestFrame: Frame? = null

    private const val PREFS = "bounce_helper"

    fun load(ctx: Context) {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        tracker.sharkColor = p.getInt("sharkColor", -1)
        tracker.paddleColor = p.getInt("paddleColor", -1)
        tracker.tolerance = p.getInt("tolerance", 60)
        tracker.paddleY = p.getFloat("paddleY", -1f)
        paddleX = p.getFloat("paddleX", -1f)
        showTracking = p.getBoolean("showTracking", true)
        extraLeadMs = p.getInt("extraLeadMs", 50)
        tracker.learner.enabled = p.getBoolean("learn", true)
        updateLead()
    }

    fun save(ctx: Context) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt("sharkColor", tracker.sharkColor)
            .putInt("paddleColor", tracker.paddleColor)
            .putInt("tolerance", tracker.tolerance)
            .putFloat("paddleY", tracker.paddleY)
            .putFloat("paddleX", paddleX)
            .putBoolean("showTracking", showTracking)
            .putInt("extraLeadMs", extraLeadMs)
            .putBoolean("learn", tracker.learner.enabled)
            .apply()
    }

    /** Whether the user has switched the helper on (the floating strip should be shown). */
    fun isEnabled(ctx: Context) =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("enabled", false)

    fun setEnabled(ctx: Context, on: Boolean) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("enabled", on).apply()
    }

    /** A private copy of the latest frame, safe to keep. */
    fun snapshot(): Frame? = synchronized(frameLock) {
        val f = latestFrame ?: return null
        Frame(f.width, f.height, f.rgba.copyOf(f.width * f.height * 4), f.scaleX, f.scaleY)
    }

    @Suppress("DEPRECATION")
    fun screenSize(ctx: Context): Point {
        val dm = ctx.getSystemService(DisplayManager::class.java)
        val p = Point()
        dm.getDisplay(Display.DEFAULT_DISPLAY).getRealSize(p)
        return p
    }
}
