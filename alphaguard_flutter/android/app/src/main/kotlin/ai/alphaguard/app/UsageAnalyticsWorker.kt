package ai.alphaguard.app

import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class UsageAnalyticsWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val usageStatsManager = applicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
                ?: return@withContext Result.failure()

            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.add(Calendar.DAY_OF_YEAR, -1)
            val startTime = calendar.timeInMillis

            val stats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime)
            var totalTimeMs: Long = 0

            for ((_, usage) in stats) {
                val totalTime = usage.totalTimeInForeground
                if (totalTime > 0) {
                    totalTimeMs += totalTime
                }
            }

            // Sync total screen time report to backend
            val sharedPref = applicationContext.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val token = sharedPref.getString("flutter.auth_token", null)
            var baseUrl = sharedPref.getString("flutter.backend_url", "http://10.0.2.2:5000")

            if (token != null && baseUrl != null) {
                if (baseUrl.endsWith("/")) {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1)
                }

                val url = URL("$baseUrl/enforce/screentime")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("app", "Device")
                    put("reason", "screen_time")
                    put("durationMs", totalTimeMs)
                }

                conn.outputStream.use { os ->
                    val input = payload.toString().toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                conn.responseCode
                conn.disconnect()
            }

            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
