package ai.alphaguard.agent

import android.app.usage.UsageStatsManager
import android.content.Context
import org.json.JSONObject
import java.util.Calendar

/**
 * (5) Screen-time enforcement. Reads today's per-app usage from UsageStatsManager,
 * reports it, and flips EnforcementManager.screenLimitReached once the daily total
 * crosses the limit. The AccessibilityService then locks restricted apps; edu +
 * emergency apps are exempt.
 */
object ScreenTimeEnforcer {

    fun todayTotalMinutes(ctx: Context): Int {
        val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val start = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0)
        }.timeInMillis
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, now)
        val totalMs = stats.sumOf { it.totalTimeInForeground }
        return (totalMs / 60000).toInt()
    }

    /** Called on a periodic tick. */
    fun evaluate(ctx: Context) {
        val limit = EnforcementManager.dailyLimitMinutes
        if (limit <= 0) return
        val used = todayTotalMinutes(ctx)
        EnforcementManager.report("usage:today", JSONObject().put("usedMinutes", used).put("limitMinutes", limit))
        val reached = used >= limit
        if (reached != EnforcementManager.screenLimitReached) {
            EnforcementManager.screenLimitReached = reached
            if (reached) EnforcementManager.report("screentime:limit_reached", JSONObject().put("usedMinutes", used))
        }
    }
}
