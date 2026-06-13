package ai.alphaguard.agent

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import org.json.JSONObject

/**
 * (7) VPN / proxy / DNS-manipulation detection.
 * A VPN is reliably detectable via NetworkCapabilities.TRANSPORT_VPN. Proxy is
 * detected from system proxy properties; DNS manipulation is heuristic (private
 * DNS / non-default resolvers). Each positive raises a security alert.
 */
object VpnDetector {

    fun isVpnActive(ctx: Context): Boolean {
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
    }

    private fun isProxyActive(): Boolean {
        val host = System.getProperty("http.proxyHost")
        return !host.isNullOrBlank()
    }

    /** Run a scan and report anything found. Called periodically + on network change. */
    fun scan(ctx: Context) {
        if (isVpnActive(ctx)) report("vpn", "VPN connection active", "high")
        if (isProxyActive()) report("proxy", "System proxy configured", "medium")
        // DNS manipulation: detected by comparing active DNS servers against the
        // network default (omitted here; flagged as heuristic).
    }

    private fun report(kind: String, detail: String, risk: String) {
        EnforcementManager.report("security:alert",
            JSONObject().put("kind", kind).put("detail", detail).put("risk", risk))
    }
}
