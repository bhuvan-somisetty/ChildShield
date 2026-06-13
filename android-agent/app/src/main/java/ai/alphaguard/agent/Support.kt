package ai.alphaguard.agent

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.location.Location
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority

/** Restart enforcement after a reboot (children often reboot to dodge controls). */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) EnforcementService.ensureRunning(context)
    }
}

/** Ongoing notification for the location foreground service (required by Android). */
object NotificationUtil {
    private const val CH = "alphaguard_protection"
    fun ongoing(ctx: Context, text: String): Notification {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(NotificationChannel(CH, "AlphaGuard Protection", NotificationManager.IMPORTANCE_LOW))
        return NotificationCompat.Builder(ctx, CH)
            .setContentTitle("AlphaGuard")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()
    }
}

/** Thin wrapper over the fused location provider for the background service. */
object FusedLocation {
    fun request(ctx: Context, onFix: (Location) -> Unit) {
        val client = LocationServices.getFusedLocationProviderClient(ctx)
        val req = com.google.android.gms.location.LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 20_000).build()
        client.requestLocationUpdates(req, { result -> result.lastLocation?.let(onFix) }, ctx.mainLooper)
    }
}
