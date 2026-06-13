package ai.alphaguard.agent

import android.content.Context
import android.os.Handler
import android.os.Looper

/**
 * Orchestrator. Starts background location, and runs a periodic tick that
 * evaluates screen-time + scans for VPN/proxy. Foreground-app blocking is event-
 * driven from the AccessibilityService; this just covers the polled detectors.
 */
object EnforcementService {

    private var started = false
    private val handler = Handler(Looper.getMainLooper())

    fun ensureRunning(ctx: Context) {
        if (started) return
        started = true
        LocationService.start(ctx)               // (9) background location + (8) mock detection
        val app = ctx.applicationContext
        val tick = object : Runnable {
            override fun run() {
                ScreenTimeEnforcer.evaluate(app)  // (5)
                VpnDetector.scan(app)             // (7)
                handler.postDelayed(this, 30_000) // every 30s
            }
        }
        handler.post(tick)
    }
}
