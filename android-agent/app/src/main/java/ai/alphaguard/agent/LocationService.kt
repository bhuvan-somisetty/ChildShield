package ai.alphaguard.agent

import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.os.IBinder
import org.json.JSONObject
import kotlin.math.abs

/**
 * (9) Background location tracking foreground service + (8) mock-location / GPS
 * spoofing detection. Each fix is checked: Location.isMock (API 31+) /
 * isFromMockProvider flags injected positions; an implausible jump (large
 * distance in a short time) is flagged as spoofing.
 */
class LocationService : Service() {

    private var last: Location? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_ID, NotificationUtil.ongoing(this, "Location sharing is on"))
        FusedLocation.request(this) { loc -> onFix(loc) }
        return START_STICKY
    }

    private fun onFix(loc: Location) {
        // (8) Mock-location detection.
        val mock = if (android.os.Build.VERSION.SDK_INT >= 31) loc.isMock else @Suppress("DEPRECATION") loc.isFromMockProvider
        if (mock) {
            EnforcementManager.report("security:alert",
                JSONObject().put("kind", "mock_location").put("detail", "Mock location detected").put("risk", "high"))
            return
        }
        // (8) Implausible jump (> ~1km in < 5s ⇒ likely spoofed).
        last?.let { prev ->
            val dt = (loc.time - prev.time) / 1000.0
            val dist = prev.distanceTo(loc)
            if (dt in 0.1..5.0 && dist > 1000) {
                EnforcementManager.report("security:alert",
                    JSONObject().put("kind", "location_jump").put("detail", "Improbable location jump").put("risk", "medium"))
            }
        }
        last = loc
        EnforcementManager.report("location:update",
            JSONObject().put("lat", loc.latitude).put("lng", loc.longitude).put("accuracy", loc.accuracy))
    }

    companion object {
        const val NOTIF_ID = 7001
        fun start(ctx: Context) = ctx.startForegroundService(Intent(ctx, LocationService::class.java))
    }
}
