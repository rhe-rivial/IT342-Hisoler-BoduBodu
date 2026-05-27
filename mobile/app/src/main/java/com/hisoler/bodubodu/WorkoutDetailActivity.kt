package com.hisoler.bodubodu

import android.os.Bundle
import android.os.CountDownTimer
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import com.hisoler.bodubodu.network.*
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

class WorkoutDetailActivity : BaseScreenActivity() {
    private var timer: CountDownTimer? = null
    private var exerciseLibrary = emptyList<Exercise>()
    private val defaultWorkout = WorkoutCache.defaultWorkout
    private val customWorkout = WorkoutCache.customWorkout
    private val workoutName = defaultWorkout?.name ?: customWorkout?.name ?: "Workout"
    private val workoutExercises = defaultWorkout?.exercises ?: customWorkout?.exercises ?: emptyList()
    private var timerRing: TimerRingView? = null
    private var currentTimerTotal = 1
    private var currentTimerLabel = "seconds left"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_workout_detail)
        bindScreen()
        findViewById<TextView>(R.id.tvTitle).text = workoutName
        findViewById<TextView>(R.id.tvSubtitle).text = "${workoutExercises.size} exercises"
        render()
        RetrofitClient.api.exercises().enqueue(object : Callback<List<Exercise>> {
            override fun onResponse(call: Call<List<Exercise>>, response: Response<List<Exercise>>) {
                exerciseLibrary = response.body().orEmpty()
                render()
            }
            override fun onFailure(call: Call<List<Exercise>>, t: Throwable) {}
        })
    }

    override fun onDestroy() {
        timer?.cancel()
        super.onDestroy()
    }

    private fun render() {
        clear()
        if (workoutExercises.isEmpty()) {
            empty("This workout has no exercises.")
            return
        }
        card {
            bold(workoutName, 20)
            small("${workoutExercises.size} exercises")
            button("Start Session") { startSession(0, 1, "exercise") }
        }
        title("Exercise Videos")
        workoutExercises.forEachIndexed { index, item ->
            val exercise = exerciseLibrary.firstOrNull { it.exerciseId == item.exerciseId || it.id == item.exerciseId }
            card {
                bold("${index + 1}. ${exerciseName(item)}")
                small("${item.sets} sets - ${item.repetitions} reps - ${item.restInterval}s rest")
                if (exercise?.description?.isNotBlank() == true) body(exercise.description)
                button("Watch Exercise") {
                    showExercisePreview(index)
                }
            }
        }
    }

    private fun showExercisePreview(index: Int) {
        clear()
        val item = workoutExercises[index]
        val exercise = exerciseLibrary.firstOrNull { it.exerciseId == item.exerciseId || it.id == item.exerciseId }
        findViewById<TextView>(R.id.tvSubtitle).text = "${index + 1} / ${workoutExercises.size}"
        addVideo(exercise?.video ?: exercise?.image)
        card {
            bold(exerciseName(item), 22)
            small("${item.sets} sets - ${item.repetitions} reps - ${item.restInterval}s rest")
            if (exercise?.description?.isNotBlank() == true) body(exercise.description)
            button("Start Session") { startSession(index, 1, "exercise") }
            if (index > 0) button("Previous Exercise", "#757575") { showExercisePreview(index - 1) }
            if (index < workoutExercises.lastIndex) button("Next Exercise", "#757575") { showExercisePreview(index + 1) }
            button("Back to Workout", "#424242") { render() }
        }
    }

    private fun showExerciseStep(index: Int, set: Int, phase: String) {
        clear()
        val item = workoutExercises[index]
        val exercise = exerciseLibrary.firstOrNull { it.exerciseId == item.exerciseId || it.id == item.exerciseId }
        findViewById<TextView>(R.id.tvSubtitle).text = if (phase == "exercise") "Set $set / ${totalSets()}" else "Rest"
        addVideo(exercise?.video ?: exercise?.image)

        if (phase == "exercise") {
            addCurrentExerciseHeader(item)
        } else {
            addRestHeader(index, set)
        }

        val timerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        timerRow.addView(navButton(
            label = if (index > 0) "<" else "",
            subLabel = if (index > 0) exerciseName(workoutExercises[index - 1]) else "Start",
            enabled = index > 0,
            click = { startSession(index - 1, 1, "exercise") }
        ), LinearLayout.LayoutParams(0, dp(86), 1f).apply { setMargins(0, 0, dp(8), 0) })

        timerRing = TimerRingView(this).apply {
            setTimer(1, 1, if (phase == "exercise") "seconds left" else "rest left")
        }
        timerRow.addView(timerRing, LinearLayout.LayoutParams(dp(150), dp(150)))

        timerRow.addView(navButton(
            label = if (index < workoutExercises.lastIndex) ">" else "",
            subLabel = if (index < workoutExercises.lastIndex) exerciseName(workoutExercises[index + 1]) else "Finish",
            enabled = index < workoutExercises.lastIndex,
            click = { startSession(index + 1, 1, "exercise") }
        ), LinearLayout.LayoutParams(0, dp(86), 1f).apply { setMargins(dp(8), 0, 0, 0) })
        content.addView(timerRow, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, dp(8), 0, dp(12)) })

        card {
            button(if (phase == "exercise") "Done - Start Rest" else "Skip Rest") {
                advance(index, set, phase)
            }
            button("Finish & Save", "#16A34A") { finishWorkout() }
        }
    }

    private fun startSession(index: Int, set: Int, phase: String) {
        if (index !in workoutExercises.indices || set > totalSets()) {
            finishWorkout()
            return
        }
        showExerciseStep(index, set, phase)
        startTimer(if (phase == "exercise") durationFromReps(workoutExercises[index].repetitions) else workoutExercises[index].restInterval) {
            advance(index, set, phase)
        }
    }

    private fun startTimer(seconds: Int, done: () -> Unit) {
        timer?.cancel()
        currentTimerTotal = seconds.coerceAtLeast(1)
        currentTimerLabel = if (findViewById<TextView>(R.id.tvSubtitle).text.toString().contains("Rest", ignoreCase = true)) {
            "rest left"
        } else {
            "seconds left"
        }
        timerRing?.setTimer(currentTimerTotal, currentTimerTotal, currentTimerLabel)
        timer = object : CountDownTimer(seconds * 1000L, 1000L) {
            override fun onTick(millisUntilFinished: Long) {
                val left = max(1, (millisUntilFinished / 1000).toInt())
                timerRing?.setTimer(currentTimerTotal, left, currentTimerLabel)
            }
            override fun onFinish() = done()
        }.start()
    }

    private fun advance(index: Int, set: Int, phase: String) {
        timer?.cancel()
        if (phase == "exercise") {
            if (nextExercisePosition(index, set) == null) {
                finishWorkout()
            } else {
                startSession(index, set, "rest")
            }
            return
        }

        val (nextIndex, nextSet) = nextExercisePosition(index, set) ?: run {
            finishWorkout()
            return
        }
        startSession(nextIndex, nextSet, "exercise")
    }

    private fun totalSets() = workoutExercises.maxOfOrNull { it.sets } ?: 1

    private fun nextExercisePosition(index: Int, set: Int): Pair<Int, Int>? {
        for (nextIndex in index + 1 until workoutExercises.size) {
            if (workoutExercises[nextIndex].sets >= set) return nextIndex to set
        }

        val nextSet = set + 1
        if (nextSet > totalSets()) return null
        for (nextIndex in workoutExercises.indices) {
            if (workoutExercises[nextIndex].sets >= nextSet) return nextIndex to nextSet
        }
        return null
    }

    private fun finishWorkout() {
        timer?.cancel()
        val completedAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(Date())
        val request = LogWorkoutRequest(
            workoutName = workoutName,
            duration = 1,
            exercises = workoutExercises.size,
            defaultWorkoutId = defaultWorkout?.defaultWorkoutId,
            customWorkoutId = customWorkout?.customWorkoutId ?: customWorkout?.id,
            completedAt = completedAt
        )
        RetrofitClient.api.logWorkout(AuthStore.authHeader(this), request).enqueue(object : Callback<ApiMessage> {
            override fun onResponse(call: Call<ApiMessage>, response: Response<ApiMessage>) {
                AppToast.success(this@WorkoutDetailActivity, "Workout logged.")
                finish()
            }
            override fun onFailure(call: Call<ApiMessage>, t: Throwable) {
                AppToast.error(this@WorkoutDetailActivity, "Finished, but logging failed.")
                finish()
            }
        })
    }

    private fun durationFromReps(reps: Int) = when {
        reps <= 5 -> 8
        reps <= 12 -> 16
        reps <= 20 -> 33
        reps <= 30 -> 50
        reps <= 50 -> 80
        else -> 120
    }

    private fun navButton(label: String, subLabel: String, enabled: Boolean, click: () -> Unit) =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isEnabled = enabled
            alpha = if (enabled) 1f else 0.55f
            setPadding(dp(4), 0, dp(4), 0)
            if (enabled) setOnClickListener { click() }

            addView(TextView(context).apply {
                text = label
                textSize = 20f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
                setTextColor(Color.parseColor("#E65100"))
            }, LinearLayout.LayoutParams(-1, -2))

            addView(TextView(context).apply {
                text = subLabel
                textSize = 10f
                gravity = Gravity.CENTER
                maxLines = 2
                setTextColor(Color.parseColor("#212121"))
            }, LinearLayout.LayoutParams(-1, -2))
        }

    private fun addCurrentExerciseHeader(item: WorkoutExercise) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            addView(TextView(context).apply {
                text = exerciseName(item)
                textSize = 24f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.parseColor("#212121"))
                gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = "${item.repetitions} reps"
                textSize = 28f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.parseColor("#E65100"))
                gravity = Gravity.CENTER
            })
        }, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, 0, 0, dp(6)) })
    }

    private fun addRestHeader(index: Int, set: Int) {
        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            addView(TextView(context).apply {
                text = "Rest"
                textSize = 24f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.parseColor("#212121"))
                gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = nextExerciseLabel(index, set)
                textSize = 14f
                setTextColor(Color.parseColor("#E65100"))
                gravity = Gravity.CENTER
            })
        }, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, 0, 0, dp(6)) })
    }

    private fun nextExerciseLabel(index: Int, set: Int): String {
        val next = nextExercisePosition(index, set)
        return if (next == null) "Last rest before finishing"
        else "Next: ${exerciseName(workoutExercises[next.first])} set ${next.second}"
    }
}
