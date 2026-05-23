package com.hisoler.bodubodu

import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.CountDownTimer
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.hisoler.bodubodu.network.*
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

class DashboardActivity : AppCompatActivity() {
    private lateinit var root: LinearLayout
    private lateinit var content: LinearLayout
    private lateinit var nav: LinearLayout

    private var tab = Tab.HOME
    private var stats: DashboardStats? = null
    private var history: List<WorkoutSession> = emptyList()
    private var exercises: List<Exercise> = emptyList()
    private var defaults: List<DefaultWorkout> = emptyList()
    private var customs: List<CustomWorkout> = emptyList()
    private var activeTimer: CountDownTimer? = null

    enum class Tab { HOME, WORKOUTS, ADD, LOGS, PROFILE }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (AuthStore.token(this).isBlank()) {
            goLogin()
            return
        }
        buildShell()
        refreshAll()
    }

    override fun onDestroy() {
        activeTimer?.cancel()
        super.onDestroy()
    }

    private fun buildShell() {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F5F5F5"))
        }
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(-1, 0, 1f)
        }
        nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.WHITE)
            elevation = dp(10).toFloat()
            layoutParams = LinearLayout.LayoutParams(-1, dp(72))
        }
        root.addView(content)
        root.addView(nav)
        setContentView(root)
        renderNav()
        loading("Loading your fitness dashboard...")
    }

    private fun refreshAll() {
        loadMe()
        loadStats()
        loadHistory()
        loadExercises()
        loadDefaultWorkouts()
        loadCustomWorkouts()
    }

    private fun loadMe() {
        RetrofitClient.api.me(AuthStore.authHeader(this)).enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                response.body()?.let { AuthStore.saveUser(this@DashboardActivity, it) }
                renderCurrentTab()
            }
            override fun onFailure(call: Call<User>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun loadStats() {
        RetrofitClient.api.dashboardStats(AuthStore.authHeader(this)).enqueue(object : Callback<DashboardStats> {
            override fun onResponse(call: Call<DashboardStats>, response: Response<DashboardStats>) {
                stats = response.body()
                renderCurrentTab()
            }
            override fun onFailure(call: Call<DashboardStats>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun loadHistory() {
        RetrofitClient.api.workoutHistory(AuthStore.authHeader(this)).enqueue(object : Callback<List<WorkoutSession>> {
            override fun onResponse(call: Call<List<WorkoutSession>>, response: Response<List<WorkoutSession>>) {
                history = response.body().orEmpty()
                renderCurrentTab()
            }
            override fun onFailure(call: Call<List<WorkoutSession>>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun loadExercises() {
        RetrofitClient.api.exercises().enqueue(object : Callback<List<Exercise>> {
            override fun onResponse(call: Call<List<Exercise>>, response: Response<List<Exercise>>) {
                exercises = response.body().orEmpty().sortedBy { it.name.lowercase() }
                renderCurrentTab()
            }
            override fun onFailure(call: Call<List<Exercise>>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun loadDefaultWorkouts() {
        RetrofitClient.api.defaultWorkouts(AuthStore.authHeader(this)).enqueue(object : Callback<List<DefaultWorkout>> {
            override fun onResponse(call: Call<List<DefaultWorkout>>, response: Response<List<DefaultWorkout>>) {
                defaults = response.body().orEmpty().sortedBy { it.name.lowercase() }
                renderCurrentTab()
            }
            override fun onFailure(call: Call<List<DefaultWorkout>>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun loadCustomWorkouts() {
        RetrofitClient.api.customWorkouts(AuthStore.authHeader(this)).enqueue(object : Callback<List<CustomWorkout>> {
            override fun onResponse(call: Call<List<CustomWorkout>>, response: Response<List<CustomWorkout>>) {
                customs = response.body().orEmpty()
                renderCurrentTab()
            }
            override fun onFailure(call: Call<List<CustomWorkout>>, t: Throwable) = renderCurrentTab()
        })
    }

    private fun renderCurrentTab() {
        when (tab) {
            Tab.HOME -> renderHome()
            Tab.WORKOUTS -> renderWorkouts()
            Tab.ADD -> renderExerciseLibrary()
            Tab.LOGS -> renderLogs()
            Tab.PROFILE -> renderProfile()
        }
    }

    private fun renderHome() {
        val user = AuthStore.user(this)
        val s = stats ?: DashboardStats()
        page {
            header("BoduBodu", "Welcome, ${user.firstName}!", "Ready for today's workout?")
            row {
                stat("Workouts", s.totalWorkouts.toString(), "#F97316")
                stat("Minutes", s.totalMinutes.toString(), "#3B82F6")
                stat("Streak", "${s.currentStreak}d", "#10B981")
            }
            title("Quick Actions")
            row {
                action("Browse", "Workouts") { switch(Tab.WORKOUTS) }
                action("Library", "Exercises") { switch(Tab.ADD) }
                action("Create", "Custom") { showCustomWorkoutDialog(null) }
            }
            title("Recent Workouts")
            if (history.isEmpty()) empty("No workouts logged yet.")
            history.take(5).forEach { workoutRow(it) }
        }
    }

    private fun renderWorkouts() {
        page {
            sectionHeader("Workouts", "Start default programs or manage your custom routines.")
            title("Default Workouts")
            if (defaults.isEmpty()) empty("No default workouts found.")
            defaults.forEach { w ->
                workoutCard(
                    name = w.name,
                    meta = "${w.difficultyLevel ?: "Beginner"} - ${w.exercises.size} exercises",
                    description = w.description.orEmpty(),
                    onStart = { startSession(w.name, w.defaultWorkoutId, null, w.exercises) }
                )
            }
            title("Custom Workouts")
            button("Create Custom Workout") { showCustomWorkoutDialog(null) }
            if (customs.isEmpty()) empty("No custom workouts yet.")
            customs.forEach { w ->
                workoutCard(
                    name = w.name,
                    meta = "${w.exercises.size} exercises - ${formatShortDate(w.createdAt)}",
                    description = w.exercises.take(3).joinToString(", ") { exerciseName(it) },
                    onStart = { startSession(w.name, null, w.customWorkoutId ?: w.id, w.exercises) },
                    onEdit = { showCustomWorkoutDialog(w) },
                    onDelete = { confirmDeleteCustom(w) }
                )
            }
        }
    }

    private fun renderExerciseLibrary() {
        page {
            sectionHeader("Exercise Library", "Browse exercises and learn proper form.")
            if (exercises.isEmpty()) empty("No exercises found.")
            exercises.groupBy { it.targetMuscleGroup ?: "Other" }.forEach { (group, list) ->
                title(group)
                list.forEach { ex ->
                    card {
                        bold(ex.name, 16)
                        small("${ex.difficultyLevel ?: "Beginner"} - ${ex.targetMuscleGroup ?: "Target muscle"}")
                        body(ex.description ?: "No description available.")
                        setOnClickListener { showExerciseDetail(ex) }
                    }
                }
            }
        }
    }

    private fun renderLogs() {
        val s = stats ?: DashboardStats()
        page {
            sectionHeader("Progress", "Your fitness journey at a glance.")
            row {
                stat("This Week", s.workoutsThisWeek.toString(), "#10B981")
                stat("Exercises", s.totalExercises.toString(), "#EC4899")
                stat("Best", "${s.longestStreak}d", "#F59E0B")
            }
            title("Workout History")
            if (history.isEmpty()) empty("No workouts logged yet.")
            history.forEach { workoutRow(it) }
        }
    }

    private fun renderProfile() {
        val user = AuthStore.user(this)
        val s = stats ?: DashboardStats()
        page {
            sectionHeader("My Profile", "Account and fitness summary.")
            card {
                bold("${user.firstName} ${user.lastName}".trim(), 20)
                small(user.email)
                small("Member since ${formatLongDate(user.createdAt)}")
                button("Edit Account") { showProfileDialog(user) }
            }
            title("Fitness Summary")
            row {
                stat("Workouts", s.totalWorkouts.toString(), "#F97316")
                stat("Minutes", s.totalMinutes.toString(), "#3B82F6")
                stat("Streak", "${s.currentStreak}d", "#10B981")
            }
            button("Sign Out", "#B91C1C") {
                AuthStore.clear(this@DashboardActivity)
                goLogin()
            }
        }
    }

    private fun showExerciseDetail(ex: Exercise) {
        AlertDialog.Builder(this)
            .setTitle(ex.name)
            .setMessage("${ex.difficultyLevel ?: "Beginner"} - ${ex.targetMuscleGroup ?: "Target muscle"}\n\n${ex.description ?: "No description available."}")
            .setPositiveButton("Close", null)
            .show()
    }

    private fun showProfileDialog(user: User) {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), 0, dp(12), 0)
        }
        val first = input(user.firstName, "First name")
        val last = input(user.lastName, "Last name")
        val email = input(user.email, "Email")
        val currentPw = input("", "Current password")
        val newPw = input("", "New password")
        currentPw.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        newPw.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        listOf(first, last, email, currentPw, newPw).forEach { box.addView(it) }

        AlertDialog.Builder(this)
            .setTitle("Edit Account")
            .setView(box)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Save") { _, _ ->
                val req = UpdateUserRequest(
                    firstName = first.text.toString().trim(),
                    lastName = last.text.toString().trim(),
                    email = email.text.toString().trim(),
                    currentPassword = currentPw.text.toString().ifBlank { null },
                    newPassword = newPw.text.toString().ifBlank { null }
                )
                RetrofitClient.api.updateMe(AuthStore.authHeader(this), req).enqueue(object : Callback<User> {
                    override fun onResponse(call: Call<User>, response: Response<User>) {
                        if (response.isSuccessful && response.body() != null) {
                            AuthStore.saveUser(this@DashboardActivity, response.body()!!)
                            AppToast.success(this@DashboardActivity, "Account updated.")
                            renderProfile()
                        } else AppToast.error(this@DashboardActivity, "Failed to update account.")
                    }
                    override fun onFailure(call: Call<User>, t: Throwable) =
                        AppToast.error(this@DashboardActivity, "Connection error: ${t.message}")
                })
            }
            .show()
    }

    private fun showCustomWorkoutDialog(edit: CustomWorkout?) {
        if (exercises.isEmpty()) {
            AppToast.error(this, "Exercises are still loading.")
            return
        }
        val selectedIds = edit?.exercises?.mapNotNull { it.exerciseId }?.toMutableSet() ?: mutableSetOf()
        val names = exercises.map { "${it.name} (${it.targetMuscleGroup ?: "General"})" }.toTypedArray()
        val checked = exercises.map { (it.exerciseId ?: it.id) in selectedIds }.toBooleanArray()
        val nameInput = input(edit?.name.orEmpty(), "Workout name")

        AlertDialog.Builder(this)
            .setTitle(if (edit == null) "Create Custom Workout" else "Edit Custom Workout")
            .setView(nameInput)
            .setMultiChoiceItems(names, checked) { _, which, isChecked ->
                val id = exercises[which].exerciseId ?: exercises[which].id ?: return@setMultiChoiceItems
                if (isChecked) selectedIds.add(id) else selectedIds.remove(id)
            }
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Save") { _, _ ->
                val name = nameInput.text.toString().trim()
                if (name.isBlank() || selectedIds.isEmpty()) {
                    AppToast.error(this, "Name and at least one exercise are required.")
                    return@setPositiveButton
                }
                val payload = CreateCustomWorkoutRequest(
                    name = name,
                    exercises = selectedIds.map {
                        CreateWorkoutExercise(it, sets = 3, repetitions = 10, restInterval = 30)
                    }
                )
                val call = if (edit == null) {
                    RetrofitClient.api.createCustomWorkout(AuthStore.authHeader(this), payload)
                } else {
                    RetrofitClient.api.updateCustomWorkout(AuthStore.authHeader(this), edit.customWorkoutId ?: edit.id ?: 0L, payload)
                }
                call.enqueue(object : Callback<CustomWorkout> {
                    override fun onResponse(call: Call<CustomWorkout>, response: Response<CustomWorkout>) {
                        if (response.isSuccessful) {
                            AppToast.success(this@DashboardActivity, if (edit == null) "Workout created." else "Workout updated.")
                            loadCustomWorkouts()
                        } else AppToast.error(this@DashboardActivity, "Failed to save workout.")
                    }
                    override fun onFailure(call: Call<CustomWorkout>, t: Throwable) =
                        AppToast.error(this@DashboardActivity, "Connection error: ${t.message}")
                })
            }
            .show()
    }

    private fun confirmDeleteCustom(workout: CustomWorkout) {
        AlertDialog.Builder(this)
            .setTitle("Delete Workout")
            .setMessage("Delete \"${workout.name}\"? This cannot be undone.")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Delete") { _, _ ->
                RetrofitClient.api.deleteCustomWorkout(AuthStore.authHeader(this), workout.customWorkoutId ?: workout.id ?: 0L)
                    .enqueue(object : Callback<Void> {
                        override fun onResponse(call: Call<Void>, response: Response<Void>) {
                            AppToast.success(this@DashboardActivity, "Workout deleted.")
                            loadCustomWorkouts()
                        }
                        override fun onFailure(call: Call<Void>, t: Throwable) =
                            AppToast.error(this@DashboardActivity, "Connection error: ${t.message}")
                    })
            }
            .show()
    }

    private fun startSession(name: String, defaultId: Long?, customId: Long?, list: List<WorkoutExercise>) {
        if (list.isEmpty()) {
            AppToast.error(this, "This workout has no exercises.")
            return
        }
        activeTimer?.cancel()
        val startMs = System.currentTimeMillis()
        var index = 0
        var set = 1
        var phase = "exercise"
        val totalSets = max(1, list.first().sets)

        val dialogView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(20), dp(12), dp(20), dp(12))
        }
        val phaseText = TextView(this).apply { textSize = 14f; setTextColor(Color.parseColor("#F97316")) }
        val titleText = TextView(this).apply { textSize = 22f; typeface = Typeface.DEFAULT_BOLD; gravity = Gravity.CENTER }
        val timerText = TextView(this).apply { textSize = 44f; typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.parseColor("#111827")) }
        val metaText = TextView(this).apply { textSize = 14f; setTextColor(Color.GRAY); gravity = Gravity.CENTER }
        val next = MaterialButton(this).apply { text = "Done" }
        listOf(phaseText, titleText, timerText, metaText, next).forEach { dialogView.addView(it) }

        val dialog = AlertDialog.Builder(this)
            .setTitle(name)
            .setView(dialogView)
            .setNegativeButton("Cancel") { _, _ -> activeTimer?.cancel() }
            .setPositiveButton("Finish & Save", null)
            .create()

        fun durationForReps(reps: Int) = when {
            reps <= 5 -> 8
            reps <= 12 -> 16
            reps <= 20 -> 33
            reps <= 30 -> 50
            reps <= 50 -> 80
            reps <= 75 -> 125
            else -> 175
        }

        fun finishWorkout() {
            activeTimer?.cancel()
            val minutes = max(1, ((System.currentTimeMillis() - startMs) / 60000).toInt())
            val completedAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date())
            val req = LogWorkoutRequest(name, minutes, list.size, defaultId, customId, completedAt)
            RetrofitClient.api.logWorkout(AuthStore.authHeader(this), req).enqueue(object : Callback<ApiMessage> {
                override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                    AppToast.success(this@DashboardActivity, "Workout complete!")
                    loadStats()
                    loadHistory()
                }
                override fun onFailure(call: Call<ApiMessage>, t: Throwable) =
                    AppToast.error(this@DashboardActivity, "Workout finished, but logging failed.")
            })
            dialog.dismiss()
        }

        fun renderTimer(seconds: Int) {
            activeTimer?.cancel()
            val ex = list[index]
            phaseText.text = if (phase == "exercise") "Set $set / $totalSets" else "Rest"
            titleText.text = if (phase == "exercise") exerciseName(ex) else "Rest"
            metaText.text = if (phase == "exercise") "${ex.repetitions} reps" else "Up next soon"
            next.text = if (index == list.lastIndex && set == totalSets && phase == "exercise") "Finish" else if (phase == "exercise") "Done - Rest" else "Skip Rest"
            activeTimer = object : CountDownTimer(seconds * 1000L, 1000L) {
                override fun onTick(millisUntilFinished: Long) {
                    val left = max(1, (millisUntilFinished / 1000).toInt())
                    timerText.text = "%02d:%02d".format(left / 60, left % 60)
                }
                override fun onFinish() {
                    next.performClick()
                }
            }.start()
        }

        fun advance() {
            if (phase == "exercise") {
                if (index == list.lastIndex && set == totalSets) {
                    finishWorkout()
                    return
                }
                phase = "rest"
                renderTimer(list[index].restInterval)
            } else {
                if (index == list.lastIndex) {
                    set += 1
                    index = 0
                } else index += 1
                phase = "exercise"
                renderTimer(durationForReps(list[index].repetitions))
            }
        }

        next.setOnClickListener { advance() }
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener { finishWorkout() }
            renderTimer(durationForReps(list[index].repetitions))
        }
        dialog.show()
    }

    private fun renderNav() {
        nav.removeAllViews()
        listOf(
            Tab.HOME to "Home",
            Tab.WORKOUTS to "Workout",
            Tab.ADD to "+",
            Tab.LOGS to "Logs",
            Tab.PROFILE to "Profile"
        ).forEach { (item, label) ->
            val tv = TextView(this).apply {
                text = label
                gravity = Gravity.CENTER
                textSize = if (item == Tab.ADD) 26f else 12f
                typeface = if (item == tab) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
                setTextColor(if (item == tab || item == Tab.ADD) Color.parseColor("#F97316") else Color.parseColor("#6B7280"))
                setOnClickListener { switch(item) }
                layoutParams = LinearLayout.LayoutParams(0, -1, 1f)
            }
            nav.addView(tv)
        }
    }

    private fun switch(next: Tab) {
        tab = next
        renderNav()
        renderCurrentTab()
    }

    private fun page(fill: LinearLayout.() -> Unit) {
        content.removeAllViews()
        val scroll = ScrollView(this)
        val body = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(18), dp(16), dp(22))
        }
        body.fill()
        scroll.addView(body)
        content.addView(scroll, ViewGroup.LayoutParams(-1, -1))
    }

    private fun loading(text: String) = page { empty(text) }

    private fun LinearLayout.header(app: String, welcome: String, sub: String) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#F97316", 22f)
            setPadding(dp(20), dp(22), dp(20), dp(26))
            addView(TextView(context).apply { this.text = app; setTextColor(Color.WHITE); textSize = 16f; typeface = Typeface.DEFAULT_BOLD })
            addView(TextView(context).apply { text = welcome; setTextColor(Color.WHITE); textSize = 26f; typeface = Typeface.DEFAULT_BOLD; setPadding(0, dp(12), 0, 0) })
            addView(TextView(context).apply { text = sub; setTextColor(Color.parseColor("#FFEDD5")); textSize = 13f })
        }, LinearLayout.LayoutParams(-1, -2).withBottom(dp(14)))
    }

    private fun LinearLayout.sectionHeader(title: String, sub: String) {
        bold(title, 26)
        small(sub)
        spacer(12)
    }

    private fun LinearLayout.title(text: String) {
        addView(TextView(context).apply {
            this.text = text
            textSize = 17f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#111827"))
            setPadding(0, dp(14), 0, dp(8))
        })
    }

    private fun LinearLayout.row(fill: LinearLayout.() -> Unit) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            weightSum = 3f
            fill()
        })
    }

    private fun LinearLayout.stat(label: String, value: String, color: String) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = rounded("#FFFFFF", 18f)
            setPadding(dp(8), dp(12), dp(8), dp(12))
            addView(TextView(context).apply { text = value; textSize = 20f; typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.parseColor(color)) })
            addView(TextView(context).apply { text = label; textSize = 11f; gravity = Gravity.CENTER; setTextColor(Color.GRAY) })
        }, LinearLayout.LayoutParams(0, dp(96), 1f).withMargins(dp(4)))
    }

    private fun LinearLayout.action(title: String, sub: String, click: () -> Unit) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = rounded("#FFFFFF", 18f)
            setOnClickListener { click() }
            addView(TextView(context).apply { text = title; textSize = 15f; typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.parseColor("#F97316")) })
            addView(TextView(context).apply { text = sub; textSize = 11f; setTextColor(Color.GRAY) })
        }, LinearLayout.LayoutParams(0, dp(92), 1f).withMargins(dp(4)))
    }

    private fun LinearLayout.card(fill: LinearLayout.() -> Unit) {
        addView(LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#FFFFFF", 18f)
            setPadding(dp(16), dp(14), dp(16), dp(14))
            fill()
        }, LinearLayout.LayoutParams(-1, -2).withBottom(dp(10)))
    }

    private fun LinearLayout.workoutCard(name: String, meta: String, description: String, onStart: () -> Unit, onEdit: (() -> Unit)? = null, onDelete: (() -> Unit)? = null) {
        card {
            bold(name, 17)
            small(meta)
            if (description.isNotBlank()) body(description)
            val actions = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
            actions.addView(simpleButton("Start", "#F97316", onStart), LinearLayout.LayoutParams(0, dp(44), 1f).withMargins(dp(3)))
            onEdit?.let { actions.addView(simpleButton("Edit", "#2563EB", it), LinearLayout.LayoutParams(0, dp(44), 1f).withMargins(dp(3))) }
            onDelete?.let { actions.addView(simpleButton("Delete", "#B91C1C", it), LinearLayout.LayoutParams(0, dp(44), 1f).withMargins(dp(3))) }
            addView(actions)
        }
    }

    private fun LinearLayout.workoutRow(w: WorkoutSession) {
        card {
            bold(w.workoutName ?: w.name ?: "Workout", 16)
            small("${w.workoutType ?: w.type ?: "DEFAULT"} - ${w.duration ?: 0} min - ${formatShortDate(w.completedAt)}")
        }
    }

    private fun LinearLayout.bold(text: String, sp: Int) {
        addView(TextView(context).apply { this.text = text; textSize = sp.toFloat(); typeface = Typeface.DEFAULT_BOLD; setTextColor(Color.parseColor("#111827")) })
    }

    private fun LinearLayout.small(text: String) {
        addView(TextView(context).apply { this.text = text; textSize = 12f; setTextColor(Color.parseColor("#6B7280")); setPadding(0, dp(2), 0, dp(4)) })
    }

    private fun LinearLayout.body(text: String) {
        addView(TextView(context).apply { this.text = text; textSize = 13f; setTextColor(Color.parseColor("#374151")); setPadding(0, dp(6), 0, dp(8)) })
    }

    private fun LinearLayout.empty(text: String) {
        card { body(text) }
    }

    private fun LinearLayout.button(text: String, color: String = "#F97316", click: () -> Unit) {
        addView(simpleButton(text, color, click), LinearLayout.LayoutParams(-1, dp(48)).withBottom(dp(8)))
    }

    private fun simpleButton(text: String, color: String, click: () -> Unit) =
        MaterialButton(this).apply {
            this.text = text
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor(color))
            setOnClickListener { click() }
        }

    private fun input(value: String, hint: String) =
        TextInputEditText(this).apply {
            setText(value)
            this.hint = hint
            setSingleLine(true)
            setPadding(dp(8), dp(8), dp(8), dp(8))
        }

    private fun exerciseName(ex: WorkoutExercise) = ex.exerciseName ?: ex.name ?: "Exercise ${ex.exerciseId ?: ""}"

    private fun formatShortDate(raw: String?): String {
        if (raw.isNullOrBlank()) return "-"
        return try {
            val normalized = raw.substringBefore(".")
            val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(normalized)
            SimpleDateFormat("MMM d", Locale.US).format(parsed!!)
        } catch (_: Exception) {
            raw.take(10)
        }
    }

    private fun formatLongDate(raw: String?): String {
        if (raw.isNullOrBlank()) return "-"
        return try {
            val normalized = raw.substringBefore(".")
            val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).parse(normalized)
            SimpleDateFormat("MMMM d, yyyy", Locale.US).format(parsed!!)
        } catch (_: Exception) {
            raw.take(10)
        }
    }

    private fun rounded(color: String, radius: Float) =
        GradientDrawable().apply {
            setColor(Color.parseColor(color))
            cornerRadius = dp(radius.toInt()).toFloat()
        }

    private fun LinearLayout.spacer(height: Int) {
        addView(View(context), LinearLayout.LayoutParams(1, dp(height)))
    }

    private fun LinearLayout.LayoutParams.withBottom(bottom: Int): LinearLayout.LayoutParams {
        setMargins(leftMargin, topMargin, rightMargin, bottom)
        return this
    }

    private fun LinearLayout.LayoutParams.withMargins(all: Int): LinearLayout.LayoutParams {
        setMargins(all, all, all, all)
        return this
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun goLogin() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
}
