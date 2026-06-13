package ai.alphaguard.agent

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject

/**
 * (3) App install detection + (4) app uninstall detection.
 * PACKAGE_ADDED → raise a parent approval request (the child app may already be
 * installed, so on a managed device installs are best gated via a managed Play
 * Store; here we at least detect + report). PACKAGE_REMOVED → notify the parent.
 */
class PackageEventReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val pkg = intent.data?.schemeSpecificPart ?: return
        if (pkg == context.packageName) return
        val replacing = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)
        if (replacing) return // an update, not a fresh install/remove

        val label = runCatching {
            val pm = context.packageManager
            pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
        }.getOrDefault(pkg)

        when (intent.action) {
            Intent.ACTION_PACKAGE_ADDED -> {
                // (3) Install detection. Post DIRECTLY to the backend — this
                // receiver fires even when the WebView/MainActivity is closed, so
                // we cannot depend on the JS bridge being alive.
                EnforcementClient.reportInstall(context, label, pkg, "App")
                // Also surface to the web app if it happens to be open (no-op when not).
                EnforcementManager.report("package:installed",
                    JSONObject().put("package", pkg).put("app", label).put("category", "App"))
            }
            Intent.ACTION_PACKAGE_REMOVED, Intent.ACTION_PACKAGE_FULLY_REMOVED -> {
                EnforcementClient.reportUninstall(context, label, pkg)
                EnforcementManager.report("package:removed",
                    JSONObject().put("package", pkg).put("app", label))
            }
        }
    }
}
