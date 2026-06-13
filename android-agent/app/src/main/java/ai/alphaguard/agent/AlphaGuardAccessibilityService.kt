package ai.alphaguard.agent

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject

/**
 * (1) Accessibility Service — the foreground-app watcher.
 * (5) Screen-time enforcement + (6) app-locking are driven from here: on every
 * window change we read the foreground package and, if policy says it must be
 * blocked, we launch the full-screen AppLockActivity over it.
 */
class AlphaGuardAccessibilityService : AccessibilityService() {

    companion object { @Volatile var isEnabled = false }

    private var lastPkg: String? = null

    override fun onServiceConnected() { isEnabled = true }
    override fun onInterrupt() {}
    override fun onDestroy() { isEnabled = false; super.onDestroy() }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg == lastPkg) return
        lastPkg = pkg

        // Report foreground usage (powers per-app screen-time accounting).
        EnforcementManager.report("usage:foreground", JSONObject().put("package", pkg))

        if (EnforcementManager.shouldBlock(pkg)) {
            val reason = if (EnforcementManager.lockedApps.contains(pkg)) "restricted" else "screen_time"
            EnforcementManager.report("screentime:locked", JSONObject().put("package", pkg).put("reason", reason))
            startActivity(Intent(this, AppLockActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                putExtra("package", pkg)
                putExtra("reason", reason)
            })
        }
    }
}
