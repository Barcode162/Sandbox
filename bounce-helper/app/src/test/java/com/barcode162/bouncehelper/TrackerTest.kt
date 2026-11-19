package com.barcode162.bouncehelper

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class TrackerTest {

    private val screenW = 1080f
    private val screenH = 2160f
    private val div = 4
    private val fw = (screenW / div).toInt()
    private val fh = (screenH / div).toInt()
    private val radius = 40f
    private val paddleY = 1800f

    /** Paint one downscaled frame: blue background, optional dark border walls, red shark. */
    private fun render(x: Float, y: Float, wallL: Float, wallR: Float, wallT: Float): Frame {
        val px = ByteArray(fw * fh * 4)
        for (j in 0 until fh) for (i in 0 until fw) {
            val sx = (i + 0.5f) * div; val sy = (j + 0.5f) * div
            val k = (j * fw + i) * 4
            val inShark = (sx - x) * (sx - x) + (sy - y) * (sy - y) <= radius * radius
            val inWall = sx < wallL || sx > wallR || sy < wallT
            val c = when {
                inShark -> intArrayOf(220, 40, 40)
                inWall -> intArrayOf(30, 30, 30)
                else -> intArrayOf(30, 90, 200)
            }
            px[k] = c[0].toByte(); px[k + 1] = c[1].toByte(); px[k + 2] = c[2].toByte(); px[k + 3] = -1
        }
        return Frame(fw, fh, px, screenW / fw, screenH / fh)
    }

    /** Exact landing x by stepping the true physics until the shark reaches the paddle. */
    private fun trueLanding(x0: Float, y0: Float, vx0: Float, vy0: Float, l: Float, r: Float, t: Float): Float {
        var x = x0; var y = y0; var vx = vx0; var vy = vy0
        val dt = 0.0002f
        val land = paddleY - radius
        while (!(vy > 0 && y >= land)) {
            x += vx * dt; y += vy * dt
            if (x < l + radius) { x = 2 * (l + radius) - x; vx = -vx }
            if (x > r - radius) { x = 2 * (r - radius) - x; vx = -vx }
            if (y < t + radius) { y = 2 * (t + radius) - y; vy = -vy }
        }
        return x
    }

    /** Average frame-to-frame change of the prediction while the shark flies straight. */
    var jitter = 0f

    private fun runScenario(wallL: Float, wallR: Float, wallT: Float, vx0: Float, vy0: Float): Pair<Int, Float> {
        var prevLanding: Float? = null
        var jitterSum = 0f
        var jitterN = 0
        val tr = Tracker().apply {
            sharkColor = 0xDC2828; tolerance = 60; paddleY = this@TrackerTest.paddleY
            screenW = this@TrackerTest.screenW; screenH = this@TrackerTest.screenH
        }
        var x = 500f; var y = 600f; var vx = vx0; var vy = vy0
        val dt = 1f / 60f
        var t = 0L
        var checked = 0
        var worst = 0f
        var framesSinceBounce = 0
        repeat(60 * 12) { frame ->
            val res = tr.process(render(x, y, wallL, wallR, wallT), t)
            // After the first ~4 s (walls learned), whenever the shark is heading down and has
            // been flying straight for a few frames, the prediction must be right.
            if (frame > 240 && vy > 0 && framesSinceBounce > 5 && y < paddleY - 200) {
                assertNotNull(res.landingX)
                val err = abs(res.landingX!! - trueLanding(x, y, vx, vy, wallL, wallR, wallT))
                worst = maxOf(worst, err)
                checked++
                prevLanding?.let { jitterSum += abs(res.landingX!! - it); jitterN++ }
                prevLanding = res.landingX
            } else {
                prevLanding = null
            }
            // advance true physics (perfect pong reflections, paddle always catches)
            x += vx * dt; y += vy * dt; t += (dt * 1e9).toLong(); framesSinceBounce++
            if (x < wallL + radius) { x = 2 * (wallL + radius) - x; vx = -vx; framesSinceBounce = 0 }
            if (x > wallR - radius) { x = 2 * (wallR - radius) - x; vx = -vx; framesSinceBounce = 0 }
            if (y < wallT + radius) { y = 2 * (wallT + radius) - y; vy = -vy; framesSinceBounce = 0 }
            if (y > paddleY - radius && vy > 0) { y = 2 * (paddleY - radius) - y; vy = -vy * 1.02f; vx *= 1.02f; framesSinceBounce = 0 }
        }
        jitter = if (jitterN > 0) jitterSum / jitterN else 0f
        return checked to worst
    }

    @Test fun predictsLandingWithScreenEdgeWalls() {
        val (checked, worst) = runScenario(0f, screenW, 0f, 900f, 1300f)
        assertTrue("checked $checked frames", checked > 50)
        assertTrue("prediction jitter $jitter px/frame", jitter < 4f)
        assertTrue("worst error $worst px", worst < 40f)
    }

    @Test fun learnsInsetWallsAndCeiling() {
        val (checked, worst) = runScenario(90f, 990f, 260f, -1100f, 1500f)
        assertTrue("checked $checked frames", checked > 50)
        assertTrue("worst error $worst px", worst < 40f)
    }

    @Test fun foldMirrorsLikeBounces() {
        assertEquals(50f, Tracker.fold(50f, 0f, 100f), 0.01f)
        assertEquals(80f, Tracker.fold(120f, 0f, 100f), 0.01f)
        assertEquals(20f, Tracker.fold(-20f, 0f, 100f), 0.01f)
        assertEquals(30f, Tracker.fold(230f, 0f, 100f), 0.01f)
    }

    @Test fun ignoresExcludedStripArea() {
        val tr = Tracker().apply { sharkColor = 0xDC2828; screenW = 1080f; screenH = 2160f }
        val f = render(500f, 600f, 0f, 1080f, 0f)
        assertNotNull(tr.detect(f, tr.sharkColor, 0, f.height))
        tr.exclude = floatArrayOf(400f, 500f, 600f, 700f)
        assertEquals(null, tr.detect(f, tr.sharkColor, 0, f.height))
    }

    // ---------------------------------------------------------------------
    // A full "game": pong launch rule (angle from hit position), speed-up per hit,
    // inset walls, and a repeating paddle pattern. Learning should beat plain physics.
    // ---------------------------------------------------------------------

    private class GameStats(val earlyErr: Float, val lateErr: Float, val flights: Int)

    private fun runGame(learn: Boolean, corr: Boolean = true, launch: Boolean = true, seq: Boolean = true): GameStats {
        val wallL = 90f; val wallR = 990f; val wallT = 260f
        val padHalf = 130f
        val tr = Tracker().apply {
            sharkColor = 0xDC2828; paddleColor = 0xF0C800; tolerance = 60
            paddleY = this@TrackerTest.paddleY; screenW = this@TrackerTest.screenW; screenH = this@TrackerTest.screenH
            leadSec = 0f
            learner.enabled = learn
            learner.useCorrection = corr; learner.useLaunch = launch; learner.useSequence = seq
        }
        val pattern = floatArrayOf(-0.8f, 0.3f, 0.6f, -0.2f, 0.9f, -0.5f)
        var flight = 0
        var x = 500f; var y = 600f; var speed = 1400f
        var vx = 700f; var vy = 1200f
        var padCx = 540f
        var descending = false
        val dt = 1f / 60f
        var t = 0L
        var sinceHit = 100; var sinceAny = 100
        var earlySum = 0f; var earlyN = 0; var lateSum = 0f; var lateN = 0
        val land = paddleY - radius
        repeat(60 * 30) { frame ->
            if (vy > 0 && !descending) {
                descending = true
                val lx = trueLanding(x, y, vx, vy, wallL, wallR, wallT)
                padCx = (lx - pattern[flight % pattern.size] * padHalf).coerceIn(wallL + padHalf, wallR - padHalf)
            }
            val px = ByteArray(fw * fh * 4)
            for (j in 0 until fh) for (i in 0 until fw) {
                val sx = (i + 0.5f) * div; val sy = (j + 0.5f) * div
                val k = (j * fw + i) * 4
                val c = when {
                    (sx - x) * (sx - x) + (sy - y) * (sy - y) <= radius * radius -> intArrayOf(220, 40, 40)
                    abs(sy - paddleY) < 12f && abs(sx - padCx) < padHalf -> intArrayOf(240, 200, 0)
                    sx < wallL || sx > wallR || sy < wallT -> intArrayOf(30, 30, 30)
                    else -> intArrayOf(30, 90, 200)
                }
                px[k] = c[0].toByte(); px[k + 1] = c[1].toByte(); px[k + 2] = c[2].toByte(); px[k + 3] = -1
            }
            val res = tr.process(Frame(fw, fh, px, screenW / fw, screenH / fh), t)
            // Grade the last 15 s (after learning had time).
            if (frame > 60 * 15 && res.landingX != null) {
                val truth = trueLanding(x, y, vx, vy, wallL, wallR, wallT)
                val err = abs(res.landingX!! - truth)
                // early = first 2 frames after leaving the paddle (when the paddle must start moving)
                if (sinceHit in 1..2) { earlySum += err; earlyN++ }
                else if (sinceAny > 5 && y < paddleY - 150) { lateSum += err; lateN++ }
            }
            x += vx * dt; y += vy * dt; t += (dt * 1e9).toLong(); sinceHit++; sinceAny++
            if (x < wallL + radius) { x = 2 * (wallL + radius) - x; vx = -vx; sinceAny = 0 }
            if (x > wallR - radius) { x = 2 * (wallR - radius) - x; vx = -vx; sinceAny = 0 }
            if (y < wallT + radius) { y = 2 * (wallT + radius) - y; vy = -vy; sinceAny = 0 }
            if (y > land && vy > 0) {
                // pong rule: out angle from where it hit the paddle; faster every hit
                val h = ((x - padCx) / padHalf).coerceIn(-1f, 1f)
                speed = minOf(3200f, speed * 1.03f)
                val a = Math.toRadians(55.0 * h)
                vx = (speed * kotlin.math.sin(a)).toFloat(); vy = -(speed * kotlin.math.cos(a)).toFloat()
                y = land - (y - land)
                descending = false; flight++
                sinceHit = 0; sinceAny = 0
            }
        }
        return GameStats(earlySum / maxOf(1, earlyN), lateSum / maxOf(1, lateN), tr.learner.flights)
    }

    @Test fun learningBeatsPlainPhysics() {
        val plain = runGame(learn = false)
        val learned = runGame(learn = true)
        println("plain:   early ${plain.earlyErr} px, steady ${plain.lateErr} px")
        println("learned: early ${learned.earlyErr} px, steady ${learned.lateErr} px, flights ${learned.flights}")
        assertTrue("flights ${learned.flights}", learned.flights > 15)
        // Right after a paddle hit, the learned launch rule should be far better than guessing.
        assertTrue("early ${learned.earlyErr} vs ${plain.earlyErr}", learned.earlyErr < plain.earlyErr * 0.75f)
        // Once flying, learning must never make it worse.
        assertTrue("steady ${learned.lateErr} vs ${plain.lateErr}", learned.lateErr <= plain.lateErr + 2f)
    }
}
