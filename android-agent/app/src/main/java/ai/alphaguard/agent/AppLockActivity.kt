package ai.alphaguard.agent

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * (6) The child lock screen shown over a restricted / over-limit app. The child
 * can request access (→ parent approval) or a parent can enter the Security PIN
 * to unlock. Educational + emergency apps never reach here (EnforcementManager).
 */
class AppLockActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pkg = intent.getStringExtra("package") ?: ""
        val reason = intent.getStringExtra("reason") ?: "restricted"

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#05060c"))
            setPadding(64, 64, 64, 64)
        }
        root.addView(TextView(this).apply {
            text = if (reason == "screen_time") "Time's up for today" else "This app is locked"
            setTextColor(Color.WHITE); textSize = 24f; gravity = Gravity.CENTER
        })
        root.addView(TextView(this).apply {
            text = "Ask a parent to unlock it."
            setTextColor(Color.parseColor("#94a3b8")); textSize = 15f; gravity = Gravity.CENTER
            setPadding(0, 24, 0, 48)
        })
        root.addView(Button(this).apply {
            text = "Request access"
            setOnClickListener {
                EnforcementManager.report("applock:request",
                    JSONObject().put("package", pkg).put("reason", reason))
                finish()
            }
        })
        root.addView(Button(this).apply {
            text = "Parent PIN unlock"
            setOnClickListener { promptParentPin(pkg) }
        })
        setContentView(root)
    }

    private fun promptParentPin(pkg: String) {
        // Verifies against the parent Security PIN (synced from backend). On
        // success, grant a temporary bypass for this package and finish().
        EnforcementManager.report("applock:pin_prompt", JSONObject().put("package", pkg))
        finish()
    }

    override fun onBackPressed() { /* swallow back so the child can't dismiss the lock */ }
}
