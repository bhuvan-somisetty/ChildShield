package ai.alphaguard.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.core.content.ContextCompat
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

class GuardMonitor : BroadcastReceiver() {
    private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == LocationManager.PROVIDERS_CHANGED_ACTION) {
            val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

            if (!isGpsEnabled && !isNetworkEnabled) {
                // GPS disabled by user
                reportLocationDisabled(context, revoked = false)
            }
        }
    }

    companion object {
        fun checkPermissionsAndReport(context: Context) {
            val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val hasBg = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }

            if (!hasFine || !hasBg) {
                // Location permission revoked by user
                GuardMonitor().reportLocationDisabled(context, revoked = true)
            }
        }
    }

    private fun reportLocationDisabled(context: Context, revoked: Boolean) {
        coroutineScope.launch {
            try {
                val sharedPref = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                val token = sharedPref.getString("flutter.auth_token", null) ?: return@launch
                var baseUrl = sharedPref.getString("flutter.backend_url", "http://10.0.2.2:5000") ?: return@launch

                if (baseUrl.endsWith("/")) {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1)
                }

                val url = URL("$baseUrl/radar/location-disabled")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("revoked", revoked)
                }

                conn.outputStream.use { os ->
                    val input = payload.toString().toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                conn.responseCode
                conn.disconnect()
            } catch (e: Exception) {
                // Fail-safe
            }
        }
    }
}
