package com.barcode162.bouncehelper

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.graphics.PixelFormat
import android.graphics.drawable.Icon
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.util.Log
import kotlin.math.max
import kotlin.math.min

/**
 * Mirrors the screen into a small (about 270 px wide) image ~60 times a second and feeds
 * each frame to the [Tracker]. Nothing is saved or sent anywhere.
 */
class CaptureService : Service() {

    companion object {
        const val EXTRA_CODE = "code"
        const val EXTRA_DATA = "data"
        const val ACTION_STOP = "com.barcode162.bouncehelper.STOP"
        private const val CHANNEL = "helper"
        private const val TAG = "CaptureService"

        fun stop(ctx: Context) {
            ctx.stopService(Intent(ctx, CaptureService::class.java))
        }
    }

    private val main = Handler(Looper.getMainLooper())
    private lateinit var thread: HandlerThread
    private lateinit var worker: Handler

    private var projection: MediaProjection? = null
    private var display: VirtualDisplay? = null
    private var reader: ImageReader? = null
    private var buffer = ByteArray(0)
    private var frameW = 0
    private var frameH = 0
    private var scaleX = 1f
    private var scaleY = 1f

    private val projectionCallback = object : MediaProjection.Callback() {
        override fun onStop() {
            main.post { stopSelf() }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        Engine.load(this)
        thread = HandlerThread("capture").also { it.start() }
        worker = Handler(thread.looper)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            Engine.setEnabled(this, false)
            HelperService.instance?.hideStrip()
            stopSelf()
            return START_NOT_STICKY
        }
        goForeground()
        if (projection != null) return START_NOT_STICKY

        val code = intent?.getIntExtra(EXTRA_CODE, 0) ?: 0
        val data: Intent? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION") intent?.getParcelableExtra(EXTRA_DATA)
        }
        val mpm = getSystemService(MediaProjectionManager::class.java)
        val p = try {
            if (data != null) mpm.getMediaProjection(code, data) else null
        } catch (e: Exception) {
            Log.e(TAG, "getMediaProjection failed", e); null
        }
        if (p == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        projection = p
        p.registerCallback(projectionCallback, worker)
        worker.post { createDisplay() }
        Engine.captureRunning = true
        HelperService.instance?.onCaptureChanged()
        return START_NOT_STICKY
    }

    private fun goForeground() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL, getString(R.string.app_name), NotificationManager.IMPORTANCE_LOW)
        )
        val stopPi = PendingIntent.getService(
            this, 1, Intent(this, CaptureService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val openPi = PendingIntent.getActivity(
            this, 2, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val n = Notification.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_notif)
            .setContentTitle("Bounce Helper is on")
            .setContentText("Watching the screen for the shark. Tap to open.")
            .setContentIntent(openPi)
            .setOngoing(true)
            .addAction(Notification.Action.Builder(Icon.createWithResource(this, R.drawable.ic_notif), "Turn off", stopPi).build())
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
        } else {
            startForeground(1, n)
        }
    }

    /** Runs on the worker thread. */
    private fun createDisplay() {
        val p = projection ?: return
        val size = Engine.screenSize(this)
        val div = max(1, min(size.x, size.y) / 270)
        frameW = size.x / div
        frameH = size.y / div
        scaleX = size.x.toFloat() / frameW
        scaleY = size.y.toFloat() / frameH
        Engine.tracker.screenW = size.x.toFloat()
        Engine.tracker.screenH = size.y.toFloat()

        val r = ImageReader.newInstance(frameW, frameH, PixelFormat.RGBA_8888, 2)
        r.setOnImageAvailableListener({ onImage(it) }, worker)
        val dpi = max(1, resources.displayMetrics.densityDpi / div)
        val old = reader
        reader = r
        val d = display
        try {
            if (d == null) {
                display = p.createVirtualDisplay(
                    "BounceHelper", frameW, frameH, dpi,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, r.surface, null, worker
                )
            } else {
                // Screen rotated: reuse the same virtual display (Android 14+ allows only one).
                d.surface = r.surface
                d.resize(frameW, frameH, dpi)
            }
        } catch (e: Exception) {
            Log.e(TAG, "createVirtualDisplay failed", e)
            main.post { stopSelf() }
        }
        old?.close()
    }

    /** Runs on the worker thread. */
    private fun onImage(r: ImageReader) {
        val img = try { r.acquireLatestImage() } catch (e: Exception) { null } ?: return
        try {
            val w = img.width
            val h = img.height
            val plane = img.planes[0]
            val src = plane.buffer
            val rowStride = plane.rowStride
            val need = w * h * 4
            val frame: Frame
            synchronized(Engine.frameLock) {
                if (buffer.size != need) buffer = ByteArray(need)
                if (rowStride == w * 4) {
                    src.position(0)
                    src.get(buffer, 0, need)
                } else {
                    for (y in 0 until h) {
                        src.position(y * rowStride)
                        src.get(buffer, y * w * 4, w * 4)
                    }
                }
                frame = Frame(w, h, buffer, Engine.tracker.screenW / w, Engine.tracker.screenH / h)
                Engine.latestFrame = frame
            }
            val result = Engine.tracker.process(frame, img.timestamp)
            main.post { HelperService.instance?.onTrack(result) }
        } catch (e: Exception) {
            Log.e(TAG, "frame failed", e)
        } finally {
            img.close()
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        worker.post {
            val size = Engine.screenSize(this)
            if (size.x.toFloat() != Engine.tracker.screenW || size.y.toFloat() != Engine.tracker.screenH) {
                Engine.tracker.resetWalls()
                Engine.tracker.resetMotion()
                createDisplay()
            }
        }
    }

    override fun onDestroy() {
        Engine.captureRunning = false
        Engine.autoOn = false
        synchronized(Engine.frameLock) { Engine.latestFrame = null }
        val p = projection
        projection = null
        worker.post {
            display?.release(); display = null
            reader?.close(); reader = null
            p?.unregisterCallback(projectionCallback)
            p?.stop()
            thread.quitSafely()
        }
        HelperService.instance?.onCaptureChanged()
        super.onDestroy()
    }
}
