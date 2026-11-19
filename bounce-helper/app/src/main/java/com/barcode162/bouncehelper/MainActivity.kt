package com.barcode162.bouncehelper

import android.Manifest
import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.SeekBar
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast

/** The setup menu: permissions, the on/off switch and a couple of settings. */
class MainActivity : Activity() {

    companion object {
        const val EXTRA_ACTIVATE = "activate"
        private const val REQ_CAPTURE = 42
        private const val REQ_NOTIF = 43
    }

    private val dp get() = resources.displayMetrics.density
    private lateinit var a11yStatus: TextView
    private var notifStatus: TextView? = null
    private lateinit var activeSwitch: Switch
    private lateinit var activeHint: TextView
    private var updatingSwitch = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Engine.load(this)
        setContentView(buildUi())
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(i: Intent?) {
        if (i?.getBooleanExtra(EXTRA_ACTIVATE, false) == true) {
            i.removeExtra(EXTRA_ACTIVATE)
            if (isA11yOn()) requestCapture()
        }
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    // ---------------------------------------------------------------------

    private fun isA11yOn(): Boolean {
        if (HelperService.instance != null) return true
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
        val me = ComponentName(this, HelperService::class.java)
        return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
    }

    private fun notifOk() = Build.VERSION.SDK_INT < 33 ||
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun refresh() {
        val a = isA11yOn()
        a11yStatus.text = if (a) "✅ Turned on" else "❌ Not turned on yet"
        a11yStatus.setTextColor(if (a) Color.rgb(120, 220, 140) else Color.rgb(255, 120, 120))
        notifStatus?.let {
            val n = notifOk()
            it.text = if (n) "✅ Allowed" else "⚠️ Not allowed (optional, but recommended)"
            it.setTextColor(if (n) Color.rgb(120, 220, 140) else Color.rgb(255, 200, 100))
        }
        updatingSwitch = true
        activeSwitch.isChecked = Engine.captureRunning
        updatingSwitch = false
        activeHint.text = when {
            !a -> "Do step 1 first."
            Engine.captureRunning -> "Helper is ON. Open your game and use the 🦈 strip."
            else -> "Helper is OFF."
        }
    }

    private fun requestCapture() {
        val mpm = getSystemService(MediaProjectionManager::class.java)
        try {
            startActivityForResult(mpm.createScreenCaptureIntent(), REQ_CAPTURE)
        } catch (e: Exception) {
            toast("This phone doesn't allow screen sharing: ${e.message}")
        }
    }

    @Deprecated("Activity result API without AndroidX")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_CAPTURE) return
        if (resultCode == RESULT_OK && data != null) {
            Engine.setEnabled(this, true)
            val i = Intent(this, CaptureService::class.java)
                .putExtra(CaptureService.EXTRA_CODE, resultCode)
                .putExtra(CaptureService.EXTRA_DATA, data)
            startForegroundService(i)
            HelperService.instance?.showStrip()
            toast("Helper on! Now open your game 🦈")
            activeSwitch.postDelayed({ refresh() }, 500)
        } else {
            toast("Screen sharing wasn't allowed, so the helper can't see the shark.")
            refresh()
        }
    }

    private fun turnOff() {
        Engine.autoOn = false
        Engine.setEnabled(this, false)
        CaptureService.stop(this)
        HelperService.instance?.hideStrip()
        activeSwitch.postDelayed({ refresh() }, 300)
    }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_LONG).show()

    // ---------------------------------------------------------------------
    // UI (built in code, no layout files or libraries)
    // ---------------------------------------------------------------------

    private fun buildUi(): View {
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding((20 * dp).toInt(), (28 * dp).toInt(), (20 * dp).toInt(), (40 * dp).toInt())
        }
        col.addView(text("🦈 Bounce Helper", 28f, bold = true))
        col.addView(text("Watches the bouncing shark in your game, predicts where it will come down " +
                "(including wall bounces) and holds the paddle there for you.", 15f, dim = true))

        // Step 1
        col.addView(card().apply {
            addView(text("1. Let the helper move the paddle", 18f, bold = true))
            addView(text("Turn on Bounce Helper in Accessibility settings. On some phones it's under " +
                    "“Installed apps” or “Downloaded apps”.", 14f, dim = true))
            a11yStatus = text("", 15f, bold = true).also { addView(it) }
            addView(button("Open Accessibility settings") {
                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            })
            if (Build.VERSION.SDK_INT >= 33) {
                addView(text("Switch greyed out or says “Restricted setting”? Tap the button below, " +
                        "then the ⋮ menu in the top corner → “Allow restricted settings”, " +
                        "then try the Accessibility switch again.", 14f, dim = true))
                addView(button("Open app info") {
                    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
                })
            }
        })

        // Step 2
        if (Build.VERSION.SDK_INT >= 33) {
            col.addView(card().apply {
                addView(text("2. Notifications", 18f, bold = true))
                addView(text("Shows a small “Bounce Helper is on” notice with a Turn off button.", 14f, dim = true))
                notifStatus = text("", 15f, bold = true).also { addView(it) }
                addView(button("Allow notifications") {
                    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQ_NOTIF)
                })
            })
        }

        // Step 3
        col.addView(card().apply {
            addView(text("${if (Build.VERSION.SDK_INT >= 33) 3 else 2}. Turn the helper on", 18f, bold = true))
            activeSwitch = Switch(this@MainActivity).apply {
                text = "Helper active"
                textSize = 18f
                setTextColor(Color.WHITE)
                setPadding(0, (10 * dp).toInt(), 0, (10 * dp).toInt())
                setOnCheckedChangeListener { _, on ->
                    if (updatingSwitch) return@setOnCheckedChangeListener
                    if (on) {
                        if (!isA11yOn()) {
                            toast("Do step 1 first (Accessibility)")
                            refresh()
                        } else requestCapture()
                    } else turnOff()
                }
            }
            addView(activeSwitch)
            activeHint = text("", 14f, dim = true).also { addView(it) }
            addView(text("Android will ask to share or record your screen. Pick “Entire screen” " +
                    "(or your game). The image never leaves the phone and nothing is saved; it's only " +
                    "used to find the shark.", 13f, dim = true))
        })

        // Tuning
        col.addView(card().apply {
            addView(text("Colour matching", 18f, bold = true))
            val label = text("", 14f, dim = true)
            fun setLabel(v: Int) { label.text = "Tolerance: $v (raise if the shark is lost, lower if it locks onto background)" }
            setLabel(Engine.tracker.tolerance)
            addView(label)
            addView(SeekBar(this@MainActivity).apply {
                max = 150
                progress = Engine.tracker.tolerance
                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(s: SeekBar?, p: Int, fromUser: Boolean) {
                        val v = p.coerceAtLeast(10)
                        Engine.tracker.tolerance = v
                        setLabel(v)
                    }
                    override fun onStartTrackingTouch(s: SeekBar?) {}
                    override fun onStopTrackingTouch(s: SeekBar?) { Engine.save(this@MainActivity) }
                })
            })
        })

        // Learning
        col.addView(card().apply {
            addView(text("🧠 Pattern learning", 18f, bold = true))
            addView(text("Records every flight and learns the game's habits: its usual prediction misses, " +
                    "how the shark leaves the paddle (angle from where it hits, speed-up per hit) and " +
                    "landing spots that repeat. Gets more accurate the longer it plays; it slowly forgets old " +
                    "flights so it keeps up as the game speeds up. The status at the bottom shows " +
                    "🧠 flights learned, typical miss, and ✓ once it knows the launch rule.", 14f, dim = true))
            addView(Switch(this@MainActivity).apply {
                text = "Learn the game's patterns"
                textSize = 16f
                setTextColor(Color.WHITE)
                isChecked = Engine.tracker.learner.enabled
                setPadding(0, (8 * dp).toInt(), 0, (8 * dp).toInt())
                setOnCheckedChangeListener { _, on ->
                    Engine.tracker.learner.enabled = on
                    Engine.save(this@MainActivity)
                }
            })
            addView(button("Forget what it learned") {
                Engine.tracker.learner.requestReset()
                toast("Learning reset. It starts fresh on the next flight.")
            })
        })

        // Delay / lead
        col.addView(card().apply {
            addView(text("Lead (delay make-up)", 18f, bold = true))
            addView(text("The screen image reaches the helper a little late, and the game reacts to the " +
                    "finger a little late too. The helper measures the first delay itself; this slider adds " +
                    "extra lead for the second. Paddle arrives late → raise it. Paddle overshoots → lower it.",
                    14f, dim = true))
            val label = text("", 14f, dim = true)
            fun setLabel(v: Int) { label.text = "Extra lead: $v ms (measured screen delay: ${Engine.captureDelayMs.toInt()} ms)" }
            setLabel(Engine.extraLeadMs)
            addView(label)
            addView(SeekBar(this@MainActivity).apply {
                max = 200
                progress = Engine.extraLeadMs
                setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                    override fun onProgressChanged(s: SeekBar?, p: Int, fromUser: Boolean) {
                        Engine.extraLeadMs = p
                        Engine.updateLead()
                        setLabel(p)
                    }
                    override fun onStartTrackingTouch(s: SeekBar?) {}
                    override fun onStopTrackingTouch(s: SeekBar?) { Engine.save(this@MainActivity) }
                })
            })
        })

        // How to use
        col.addView(card().apply {
            addView(text("How to use", 18f, bold = true))
            addView(text(
                "1. Open your game and start a round.\n" +
                "2. Tap the 🦈 tab to pop out the tool strip. Drag the 🦈 to move it anywhere.\n" +
                "3. 🎯 Shark: the screen freezes, so tap the middle of the shark.\n" +
                "4. ▬ Paddle: tap the middle of your paddle/platform.\n" +
                "5. ▶ Auto: the helper holds the paddle and slides it under the spot where the shark " +
                "will land. The pink triangle under the paddle shows the predicted spot.\n" +
                "6. ■ Stop to let go. 👁 hides the markers. ⏻ turns the helper off.\n\n" +
                "Touching the screen yourself interrupts the helper for a moment; it grabs the paddle " +
                "again on its own.", 14f, dim = true))
        })

        return ScrollView(this).apply {
            setBackgroundColor(Color.rgb(8, 20, 34))
            addView(col)
        }
    }

    private fun text(s: String, size: Float, bold: Boolean = false, dim: Boolean = false) = TextView(this).apply {
        text = s
        textSize = size
        setTextColor(if (dim) Color.argb(200, 220, 230, 240) else Color.WHITE)
        if (bold) typeface = Typeface.DEFAULT_BOLD
        setPadding(0, (6 * dp).toInt(), 0, (6 * dp).toInt())
    }

    private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 15f
        setTextColor(Color.rgb(20, 20, 20))
        background = GradientDrawable().apply { cornerRadius = 14 * dp; setColor(Color.rgb(255, 179, 0)) }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = (6 * dp).toInt(); bottomMargin = (6 * dp).toInt() }
        setOnClickListener { onClick() }
    }

    private fun card() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.START
        background = GradientDrawable().apply { cornerRadius = 18 * dp; setColor(Color.rgb(20, 38, 58)) }
        setPadding((16 * dp).toInt(), (12 * dp).toInt(), (16 * dp).toInt(), (14 * dp).toInt())
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = (16 * dp).toInt() }
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        refresh()
    }
}
