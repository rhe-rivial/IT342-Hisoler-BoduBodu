package com.hisoler.bodubodu

import android.app.AlertDialog
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.hisoler.bodubodu.network.WorkoutExercise
import com.hisoler.bodubodu.network.WorkoutSession
import java.text.SimpleDateFormat
import java.util.Locale

open class BaseScreenActivity : AppCompatActivity() {
    protected lateinit var content: LinearLayout
    protected fun isScreenReady() = ::content.isInitialized

    protected fun bindScreen() {
        if (AuthStore.token(this).isBlank()) {
            openOnly(LoginActivity::class.java)
            return
        }
        content = findViewById(R.id.screenContent)
        findViewById<View>(R.id.btnBack)?.setOnClickListener { finish() }
        wireBottomNav()
    }

    protected fun wireBottomNav() {
        findViewById<View>(R.id.navHome)?.setOnClickListener { openOnly(DashboardActivity::class.java) }
        findViewById<View>(R.id.navWorkout)?.setOnClickListener { openOnly(WorkoutActivity::class.java) }
        findViewById<View>(R.id.navAdd)?.setOnClickListener { openOnly(CustomWorkoutActivity::class.java) }
        findViewById<View>(R.id.navLogs)?.setOnClickListener { openOnly(HistoryActivity::class.java) }
        findViewById<View>(R.id.navProfile)?.setOnClickListener { openOnly(ProfileActivity::class.java) }
    }

    protected fun <T> openOnly(clazz: Class<T>) {
        if (this::class.java == clazz) return
        startActivity(Intent(this, clazz))
        finish()
    }

    protected fun clear() = content.removeAllViews()

    protected fun title(text: String) {
        content.addView(TextView(this).apply {
            this.text = text
            textSize = 17f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#212121"))
            setPadding(0, dp(10), 0, dp(8))
        })
    }

    protected fun card(fill: LinearLayout.() -> Unit) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#FFFFFF", 18)
            setPadding(dp(16), dp(14), dp(16), dp(14))
            fill()
        }, LinearLayout.LayoutParams(-1, -2).bottom(dp(10)))
    }

    protected fun centeredCard(fill: LinearLayout.() -> Unit) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            background = rounded("#FFFFFF", 18)
            setPadding(dp(16), dp(16), dp(16), dp(16))
            fill()
        }, LinearLayout.LayoutParams(-1, -2).bottom(dp(10)))
    }

    protected fun LinearLayout.bold(text: String, size: Int = 16) {
        addView(TextView(context).apply {
            this.text = text
            textSize = size.toFloat()
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#212121"))
            gravity = Gravity.CENTER_VERTICAL
        })
    }

    protected fun LinearLayout.small(text: String) {
        addView(TextView(context).apply {
            this.text = text
            textSize = 12f
            setTextColor(Color.parseColor("#757575"))
            setPadding(0, dp(2), 0, dp(4))
        })
    }

    protected fun LinearLayout.body(text: String) {
        addView(TextView(context).apply {
            this.text = text
            textSize = 13f
            setTextColor(Color.parseColor("#424242"))
            setPadding(0, dp(6), 0, dp(8))
        })
    }

    protected fun LinearLayout.button(text: String, color: String = "#E65100", click: () -> Unit) {
        addView(MaterialButton(context).apply {
            this.text = text
            isAllCaps = false
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor(color))
            setOnClickListener { click() }
        }, LinearLayout.LayoutParams(-1, dp(48)).bottom(dp(6)))
    }

    protected fun empty(text: String) {
        card { body(text) }
    }

    protected fun statRow(vararg stats: Pair<String, String>) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            stats.forEach { (label, value) ->
                addView(LinearLayout(context).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    background = rounded("#FFFFFF", 18)
                    addView(TextView(context).apply {
                        text = value
                        textSize = 22f
                        typeface = Typeface.DEFAULT_BOLD
                        setTextColor(Color.parseColor("#E65100"))
                        gravity = Gravity.CENTER
                    })
                    addView(TextView(context).apply {
                        text = label
                        textSize = 11f
                        setTextColor(Color.GRAY)
                        gravity = Gravity.CENTER
                    })
                }, LinearLayout.LayoutParams(0, dp(96), 1f).margins(dp(4)))
            }
        })
    }

    protected fun actionRow(vararg actions: Pair<String, () -> Unit>) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            actions.forEach { (label, click) ->
                addView(MaterialButton(context).apply {
                    text = label
                    textSize = 11f
                    isAllCaps = false
                    setTextColor(Color.WHITE)
                    backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E65100"))
                    setOnClickListener { click() }
                    minHeight = dp(48)
                    minimumHeight = dp(48)
                    insetTop = 0
                    insetBottom = 0
                }, LinearLayout.LayoutParams(0, dp(52), 1f).margins(dp(4)))
            }
        }, LinearLayout.LayoutParams(-1, -2).bottom(dp(8)))
    }

    protected fun searchBox(hint: String, onChanged: (String) -> Unit): TextInputEditText {
        val input = TextInputEditText(this).apply {
            this.hint = hint
            textSize = 14f
            setSingleLine(true)
            minHeight = dp(50)
            setPadding(dp(14), 0, dp(14), 0)
            background = rounded("#FFFFFF", 14)
            tag = false
            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    if (tag == true) return
                    onChanged(s?.toString().orEmpty())
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
        content.addView(input, LinearLayout.LayoutParams(-1, dp(50)).bottom(dp(10)))
        return input
    }

    protected fun setSearchText(input: TextInputEditText, text: String) {
        input.tag = true
        input.setText(text)
        input.setSelection(text.length)
        input.tag = false
    }

    protected fun workoutRow(workout: WorkoutSession) {
        card {
            bold(workout.workoutName ?: workout.name ?: "Workout")
            small("${workout.workoutType ?: workout.type ?: "DEFAULT"} - ${workout.duration ?: 0} min - ${formatDate(workout.completedAt)}")
        }
    }

    protected fun addVideo(url: String?) {
        if (url.isNullOrBlank()) {
            bodyText("No exercise video available.")
            return
        }
        val video = VideoView(this).apply {
            setVideoURI(Uri.parse(url))
            setOnPreparedListener { it.isLooping = true; start() }
            setOnCompletionListener { start() }
            setOnClickListener { start() }
            isFocusable = false
            isFocusableInTouchMode = false
        }
        content.addView(video, LinearLayout.LayoutParams(-1, dp(220)).bottom(dp(12)))
    }

    protected fun bodyText(text: String) {
        content.addView(TextView(this).apply {
            this.text = text
            textSize = 13f
            setTextColor(Color.parseColor("#424242"))
            setPadding(0, dp(4), 0, dp(10))
        })
    }

    protected fun exerciseName(ex: WorkoutExercise) = ex.exerciseName ?: ex.name ?: "Exercise ${ex.exerciseId ?: ""}"

    protected fun input(value: String, hint: String) =
        TextInputEditText(this).apply {
            setText(value)
            this.hint = hint
            setSingleLine(true)
        }

    protected fun confirm(title: String, message: String, yes: () -> Unit) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Confirm") { _, _ -> yes() }
            .show()
    }

    protected fun formatDate(raw: String?): String {
        if (raw.isNullOrBlank()) return "-"
        return try {
            val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(raw.substringBefore("."))
            SimpleDateFormat("MMM d, yyyy", Locale.US).format(parsed!!)
        } catch (_: Exception) {
            raw.take(10)
        }
    }

    protected fun rounded(color: String, radius: Int) =
        GradientDrawable().apply {
            setColor(Color.parseColor(color))
            cornerRadius = dp(radius).toFloat()
        }

    protected fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun LinearLayout.LayoutParams.bottom(value: Int): LinearLayout.LayoutParams {
        setMargins(leftMargin, topMargin, rightMargin, value)
        return this
    }

    private fun LinearLayout.LayoutParams.margins(value: Int): LinearLayout.LayoutParams {
        setMargins(value, value, value, value)
        return this
    }
}
