package ai.alphaguard.agent

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import org.json.JSONObject

/**
 * (2)(10) Device Admin — AlphaGuard uninstall + tamper protection.
 * While this admin is active the app cannot be uninstalled without first being
 * deactivated, and that deactivation is what we intercept (onDisableRequested)
 * to raise a tamper alert and require the parent PIN.
 */
class AlphaGuardDeviceAdmin : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        EnforcementManager.report("tamper:admin_enabled", JSONObject())
    }

    /** Fired when someone tries to disable Device Admin (the step before uninstall). */
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        EnforcementManager.report(
            "tamper:alert",
            JSONObject().put("kind", "device_admin_disable_attempt").put("risk", "high")
        )
        // Returning a warning keeps the user on the confirmation screen. Real
        // blocking is enforced by requiring the parent PIN in the companion flow.
        return "AlphaGuard protection is on. A parent Security PIN is required to remove it."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        EnforcementManager.report("tamper:alert", JSONObject().put("kind", "device_admin_disabled").put("risk", "high"))
    }
}

object DeviceAdminUtil {
    fun component(ctx: Context) = ComponentName(ctx, AlphaGuardDeviceAdmin::class.java)
    fun dpm(ctx: Context) = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    fun isActive(ctx: Context) = dpm(ctx).isAdminActive(component(ctx))

    /** Intent the onboarding flow fires to request Device Admin from the user. */
    fun enableIntent(ctx: Context) = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
        putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component(ctx))
        putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
            "AlphaGuard needs Device Admin to protect itself from being removed by the child.")
    }
}
