package ai.alphaguard.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        // Android 16 (API 36) enforcement: Starting a location-typed foreground
        // service requires the app to be in an eligible foreground state. A
        // BOOT_COMPLETED receiver does NOT satisfy that requirement on API 36+.
        // Skip the direct start here — TrackingService will be started by the app
        // when it comes to the foreground and permissions are confirmed.
        if (Build.VERSION.SDK_INT >= 36) {
            Log.d("AlphaGuard/Boot", "Skipping TrackingService start on API 36+: " +
                    "location FGS requires eligible foreground state (not available at boot).")
            return
        }

        // Guard: only start if location permission is already granted.
        // TrackingService declares foregroundServiceType="location", so attempting
        // startForegroundService() without the runtime permission throws
        // SecurityException on API 34+ when the service calls startForeground().
        val hasFine = ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) {
            Log.d("AlphaGuard/Boot", "Skipping TrackingService start: " +
                    "location permission not yet granted.")
            return
        }

        val serviceIntent = Intent(context, TrackingService::class.java)
        try {
            ContextCompat.startForegroundService(context, serviceIntent)
            Log.d("AlphaGuard/Boot", "TrackingService start requested.")
        } catch (e: Exception) {
            Log.w("AlphaGuard/Boot", "Failed to start TrackingService at boot: ${e.message}")
        }
    }
}
