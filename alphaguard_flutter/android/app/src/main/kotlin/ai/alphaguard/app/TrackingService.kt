package ai.alphaguard.app

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.ExistingPeriodicWorkPolicy
import java.util.concurrent.TimeUnit
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class TrackingService : Service() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var locationCallback: LocationCallback? = null
    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private var batteryReceiver: BatteryReceiver? = null

    companion object {
        const val CHANNEL_ID = "AlphaGuardTrackingChannel"
        const val NOTIFICATION_ID = 48271
        
        var isRunning = false
            private set
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AlphaGuard Active Protection")
            .setContentText("Monitoring location & safety")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setOngoing(true)
            .build()

        val hasLocation = ContextCompat.checkSelfPermission(
            this, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            this, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasLocation) {
            // Permissions missing. We MUST still call startForeground() before stopSelf()
            // to satisfy the 5-second rule (API 26+), otherwise Android throws
            // ForegroundServiceDidNotStartInTimeException.
            //
            // On Android 16 (API 36) with targetSdk=36, calling startForeground() for a
            // service that declares foregroundServiceType="location" requires runtime location
            // permission — even without passing the type parameter. Use FOREGROUND_SERVICE_TYPE_DATA_SYNC
            // as a safe fallback type (no runtime permission required).
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
            } catch (e: Exception) {
                android.util.Log.e("AlphaGuard/Tracking", "Fallback startForeground failed: ${e.message}")
            }
            android.util.Log.w("AlphaGuard/Tracking", "Stopping: location permission not granted.")
            stopSelf()
            return START_NOT_STICKY
        }

        // Location permission confirmed — start as location-typed FGS (API 29+).
        // On API 34+, the single typed call is required; the old two-step "promote"
        // pattern breaks on Android 16 (targetSdk=36).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
            } catch (e: Exception) {
                android.util.Log.e("AlphaGuard/Tracking", "startForeground with location type failed: ${e.message}")
                stopSelf()
                return START_NOT_STICKY
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isRunning = true

        serviceScope.launch {
            startLocationUpdates()
            registerBatteryMonitor()
            scheduleUsageAnalytics()
        }

        return START_STICKY
    }

    private fun scheduleUsageAnalytics() {
        try {
            val workRequest = PeriodicWorkRequestBuilder<UsageAnalyticsWorker>(1, java.util.concurrent.TimeUnit.HOURS)
                .build()
            WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
                "UsageAnalyticsWork",
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
        } catch (e: Exception) {
            // Fail-safe
        }
    }

    private fun registerBatteryMonitor() {
        if (batteryReceiver == null) {
            batteryReceiver = BatteryReceiver()
            registerReceiver(batteryReceiver, android.content.IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 300000) // 5 minutes
            .setMinUpdateIntervalMillis(60000) // 1 minute
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    pushLocationToBackend(location)
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                mainLooper
            )
        } catch (unlikely: SecurityException) {
            isRunning = false
        }
    }

    private fun pushLocationToBackend(location: Location) {
        serviceScope.launch {
            try {
                val sharedPref = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                val token = sharedPref.getString("flutter.auth_token", null) ?: return@launch
                var baseUrl = sharedPref.getString("flutter.backend_url", "http://10.0.2.2:5000") ?: return@launch
                
                // Trim trailing slash if present
                if (baseUrl.endsWith("/")) {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1)
                }

                val url = URL("$baseUrl/location")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("lat", location.latitude)
                    put("lng", location.longitude)
                    put("accuracy", location.accuracy.toDouble())
                    if (location.hasSpeed() && location.speed > 0.5) {
                        put("speed", location.speed.toDouble())
                    }
                }

                conn.outputStream.use { os ->
                    val input = payload.toString().toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val code = conn.responseCode
                conn.disconnect()
            } catch (e: Exception) {
                // Fail-safe
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AlphaGuard Tracking Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps AlphaGuard background tracking alive"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        isRunning = false
        locationCallback?.let { fusedLocationClient.removeLocationUpdates(it) }
        batteryReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {}
        }
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
