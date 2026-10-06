package ai.alphaguard.app

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "ai.alphaguard/agent"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "startTracking" -> {
                    startTrackingService()
                    result.success(true)
                }
                "stopTracking" -> {
                    stopTrackingService()
                    result.success(true)
                }
                "getTrackingStatus" -> {
                    result.success(getTrackingStatusMap())
                }
                "requestUsageAccess" -> {
                    requestUsageAccessPermission()
                    result.success(true)
                }
                "requestBatteryOptimizationExemption" -> {
                    requestBatteryOptimization()
                    result.success(true)
                }
                "requestOverlayPermission" -> {
                    requestOverlayPermission()
                    result.success(true)
                }
                "requestLocationPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        requestPermissions(arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION), 102)
                    }
                    result.success(true)
                }
                "requestBackgroundLocationPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        requestPermissions(arrayOf(android.Manifest.permission.ACCESS_BACKGROUND_LOCATION), 103)
                    }
                    result.success(true)
                }
                "requestNotificationPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
                    }
                    result.success(true)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun startTrackingService() {
        // Guard: TrackingService declares foregroundServiceType="location". On Android 16+
        // (targetSdk=36) calling startForeground() for such a service without runtime location
        // permission throws SecurityException. Skip if not granted — the permission wizard
        // will call startTracking() again after the user grants permission.
        val hasFine = ContextCompat.checkSelfPermission(
            this, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            this, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasFine && !hasCoarse) {
            android.util.Log.w("AlphaGuard/Main", "startTracking skipped: location permission not granted.")
            return
        }
        val intent = Intent(this, TrackingService::class.java)
        ContextCompat.startForegroundService(this, intent)
    }

    private fun stopTrackingService() {
        val intent = Intent(this, TrackingService::class.java)
        stopService(intent)
    }

    private fun getTrackingStatusMap(): Map<String, Any> {
        val hasFine = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasBg = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        
        val hasUsage = hasUsageStatsPermission()
        val hasNotifications = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        
        val isBatteryExempt = isBatteryOptimizationExempt()
        val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this) else true

        return mapOf(
            "isTracking" to TrackingService.isRunning,
            "locationPermission" to if (hasFine) "granted" else "denied",
            "backgroundLocationPermission" to if (hasBg) "granted" else "denied",
            "usageAccessPermission" to if (hasUsage) "granted" else "denied",
            "overlayPermission" to if (hasOverlay) "granted" else "denied",
            "notificationPermission" to hasNotifications,
            "isBatteryExempt" to isBatteryExempt,
            "deviceManufacturer" to Build.MANUFACTURER.lowercase()
        )
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        } else {
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun isBatteryOptimizationExempt(): Boolean {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pm.isIgnoringBatteryOptimizations(packageName)
        } else {
            true
        }
    }

    private fun requestUsageAccessPermission() {
        // Deep-link directly to AlphaGuard's row in the Usage Access list (Android 10+).
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            data = Uri.fromParts("package", packageName, null)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            // Fallback: open the general Usage Access settings list
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })
        }
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                data = Uri.parse("package:$packageName")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                })
            }
        }
    }

    private fun requestBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent().apply {
                action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                data = Uri.parse("package:$packageName")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                val settingsIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(settingsIntent)
            }
        }
    }
}
