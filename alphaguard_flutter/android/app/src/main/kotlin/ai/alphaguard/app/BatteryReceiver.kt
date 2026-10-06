package ai.alphaguard.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.BatteryManager
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

class BatteryReceiver : BroadcastReceiver() {
    private val coroutineScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BATTERY_CHANGED) {
            val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            val batteryPct = if (level >= 0 && scale > 0) (level * 100 / scale.toFloat()).toInt() else -1

            val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                             status == BatteryManager.BATTERY_STATUS_FULL

            if (batteryPct >= 0) {
                pushBatteryToBackend(context, batteryPct, isCharging)
            }
        }
    }

    private fun pushBatteryToBackend(context: Context, level: Int, charging: Boolean) {
        coroutineScope.launch {
            try {
                val sharedPref = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
                val token = sharedPref.getString("flutter.auth_token", null) ?: return@launch
                var baseUrl = sharedPref.getString("flutter.backend_url", "http://10.0.2.2:5000") ?: return@launch

                if (baseUrl.endsWith("/")) {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1)
                }

                val url = URL("$baseUrl/battery")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("level", level)
                    put("charging", charging)
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
