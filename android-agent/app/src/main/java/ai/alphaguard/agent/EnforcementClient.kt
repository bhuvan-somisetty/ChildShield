package ai.alphaguard.agent

import android.content.Context
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

/**
 * Direct backend client for the native agent. App installs (and uninstalls) are
 * detected by a BroadcastReceiver that can fire when the WebView/MainActivity is
 * NOT open — so we must POST to the backend ourselves rather than rely on the JS
 * bridge being alive. Failed posts are queued and flushed on the next event.
 *
 * Endpoint: POST /api/enforce/install  { app, package, category }  (Bearer child token)
 *
 * Requires: implementation("com.squareup.okhttp3:okhttp:4.12.0")
 */
object EnforcementClient {
    private const val PREFS = "ag_enforce"
    private const val JSON_MT = "application/json"
    private val http = OkHttpClient()

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Called from the web app via the JS bridge once its session is established. */
    fun setSession(ctx: Context, baseUrl: String, token: String) {
        prefs(ctx).edit().putString("base", baseUrl).putString("token", token).apply()
    }

    private fun base(ctx: Context) = prefs(ctx).getString("base", null)
    private fun token(ctx: Context) = prefs(ctx).getString("token", null)

    /** (3) App install detected → backend approval request. */
    fun reportInstall(ctx: Context, app: String, pkg: String, category: String) {
        post(ctx, "/api/enforce/install", JSONObject().put("app", app).put("package", pkg).put("category", category))
    }

    /** (4) App uninstall detected → notify parent. */
    fun reportUninstall(ctx: Context, app: String, pkg: String) {
        post(ctx, "/api/enforce/uninstall", JSONObject().put("app", app).put("package", pkg))
    }

    private fun post(ctx: Context, path: String, body: JSONObject) {
        val base = base(ctx); val token = token(ctx)
        if (base == null || token == null) { enqueue(ctx, path, body); return } // not provisioned yet
        send(ctx, base, token, path, body) { ok -> if (ok) flush(ctx, base, token) else enqueue(ctx, path, body) }
    }

    private fun send(ctx: Context, base: String, token: String, path: String, body: JSONObject, done: (Boolean) -> Unit) {
        val req = Request.Builder()
            .url(base + path)
            .header("Authorization", "Bearer $token")
            .post(body.toString().toRequestBody(JSON_MT.toMediaType()))
            .build()
        http.newCall(req).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) = done(false)
            override fun onResponse(call: Call, response: Response) { response.use { done(it.isSuccessful) } }
        })
    }

    // ── tiny persistent retry queue ─────────────────────────────────────────
    private fun enqueue(ctx: Context, path: String, body: JSONObject) {
        val q = JSONArray(prefs(ctx).getString("queue", "[]"))
        q.put(JSONObject().put("path", path).put("body", body))
        prefs(ctx).edit().putString("queue", q.toString()).apply()
    }

    private fun flush(ctx: Context, base: String, token: String) {
        val raw = prefs(ctx).getString("queue", "[]") ?: "[]"
        prefs(ctx).edit().putString("queue", "[]").apply()
        val q = JSONArray(raw)
        for (i in 0 until q.length()) {
            val item = q.getJSONObject(i)
            send(ctx, base, token, item.getString("path"), item.getJSONObject("body")) { ok ->
                if (!ok) enqueue(ctx, item.getString("path"), item.getJSONObject("body"))
            }
        }
    }
}
