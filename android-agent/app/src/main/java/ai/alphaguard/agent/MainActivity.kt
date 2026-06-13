package ai.alphaguard.agent

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/**
 * Hosts the existing web child app in a WebView and wires the native↔web bridge:
 *  - web → native: `window.AlphaGuardNative.setPolicy(json)` etc.
 *  - native → web: `window.AlphaGuard.onNativeEvent(event, data)` — the web app
 *    forwards these to the backend on its open Socket.IO connection.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false   // WebRTC monitoring autoplay
        web.addJavascriptInterface(Bridge(), "AlphaGuardNative")
        setContentView(web)

        // Forward native enforcement events into the web app.
        EnforcementManager.setSink { event, data ->
            runOnUiThread {
                web.evaluateJavascript(
                    "window.AlphaGuard && window.AlphaGuard.onNativeEvent('$event', $data)", null
                )
            }
        }

        // Load the deployed web child app (served by Vite/host).
        web.loadUrl(BuildConfig.WEB_APP_URL + "/child/app/home")

        EnforcementService.ensureRunning(this)   // start accessibility/location watchers
    }

    /** Methods callable from JS (web → native). */
    inner class Bridge {
        // The web app hands its backend session to native so install/uninstall
        // detection can POST directly even when this WebView is closed.
        @JavascriptInterface fun setSession(baseUrl: String, token: String) = EnforcementClient.setSession(this@MainActivity, baseUrl, token)
        @JavascriptInterface fun setPolicy(json: String) = EnforcementManager.applyPolicy(JSONObject(json))
        @JavascriptInterface fun isProtectionEnabled(): Boolean = EnforcementManager.protectionEnabled
        @JavascriptInterface fun requestUninstallSelf(): Boolean {
            // Uninstalling AlphaGuard requires deactivating Device Admin, which is
            // gated by the parent PIN — so we never auto-allow it here.
            return false
        }
        @JavascriptInterface fun deviceStatus(): String = JSONObject().apply {
            put("admin", DeviceAdminUtil.isActive(this@MainActivity))
            put("accessibility", AlphaGuardAccessibilityService.isEnabled)
            put("vpn", VpnDetector.isVpnActive(this@MainActivity))
        }.toString()
    }
}
