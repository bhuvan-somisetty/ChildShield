package ai.alphaguard.agent

import org.json.JSONObject

/**
 * Central enforcement state + event bus. OS components (accessibility, package
 * receiver, detectors) read policy from here and report events through here.
 * Events are forwarded to the web child app over the WebView bridge, which emits
 * them to the backend on the already-open Socket.IO connection.
 */
object EnforcementManager {

    // Policy pushed from the parent (via the web app → setPolicy bridge).
    @Volatile var lockedApps: Set<String> = emptySet()        // package names the child can't open
    @Volatile var eduApps: Set<String> = emptySet()           // always allowed (educational)
    @Volatile var emergencyApps: Set<String> = setOf("com.android.dialer", "com.google.android.dialer")
    @Volatile var dailyLimitMinutes: Int = 0                  // 0 = no limit
    @Volatile var screenLimitReached: Boolean = false
    @Volatile var protectionEnabled: Boolean = true           // uninstall/force-stop protection

    private var sink: ((String, JSONObject) -> Unit)? = null

    /** The WebView bridge registers here so native events reach the web app. */
    fun setSink(s: (String, JSONObject) -> Unit) { sink = s }

    fun report(event: String, data: JSONObject) { sink?.invoke(event, data) }

    fun applyPolicy(json: JSONObject) {
        lockedApps = json.optJSONArray("lockedApps")?.toStringSet() ?: lockedApps
        eduApps = json.optJSONArray("eduApps")?.toStringSet() ?: eduApps
        dailyLimitMinutes = json.optInt("dailyLimitMinutes", dailyLimitMinutes)
        screenLimitReached = json.optBoolean("screenLimitReached", screenLimitReached)
        protectionEnabled = json.optBoolean("protectionEnabled", protectionEnabled)
    }

    /** A foreground app must be blocked when restricted, or when the daily limit is
     *  reached — except educational and emergency apps, which always pass. */
    fun shouldBlock(pkg: String): Boolean {
        if (pkg == BuildConfig.LIBRARY_PACKAGE_NAME || pkg == "ai.alphaguard.agent") return false
        if (eduApps.contains(pkg) || emergencyApps.contains(pkg)) return false
        if (lockedApps.contains(pkg)) return true
        if (screenLimitReached && dailyLimitMinutes > 0) return true
        return false
    }

    private fun org.json.JSONArray.toStringSet(): Set<String> =
        (0 until length()).map { getString(it) }.toSet()
}
