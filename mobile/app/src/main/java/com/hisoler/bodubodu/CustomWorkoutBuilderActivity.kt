package com.hisoler.bodubodu

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import com.google.android.material.button.MaterialButton
import com.hisoler.bodubodu.network.CreateCustomWorkoutRequest
import com.hisoler.bodubodu.network.CreateWorkoutExercise
import com.hisoler.bodubodu.network.CustomWorkout
import com.hisoler.bodubodu.network.Exercise
import com.hisoler.bodubodu.network.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class CustomWorkoutBuilderActivity : BaseScreenActivity() {
    private data class ExerciseConfig(
        var sets: Int = 3,
        var repetitions: Int = 10,
        var restInterval: Int = 30
    )

    private val selectedIds = mutableListOf<Long>()
    private val configs = mutableMapOf<Long, ExerciseConfig>()
    private var allExercises = emptyList<Exercise>()
    private lateinit var exerciseList: LinearLayout
    private var edit = WorkoutCache.customWorkout
    private var detailsStep = false
    private var workoutNameDraft = edit?.name.orEmpty()
    private var nameInput: EditText? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_workout_builder)
        bindScreen()
        exerciseList = findViewById(R.id.exerciseList)
        findViewById<TextView>(R.id.tvTitle).text = if (edit == null) "Build Workout" else "Edit Workout"
        clear()
        exerciseList.removeAllViews()
        empty("Loading exercises...")
        loadExercises()
    }

    override fun onBackPressed() {
        if (detailsStep) {
            rememberName()
            renderSelection()
        } else {
            super.onBackPressed()
        }
    }

    private fun loadExercises() {
        RetrofitClient.api.exercises().enqueue(object : Callback<List<Exercise>> {
            override fun onResponse(call: Call<List<Exercise>>, response: Response<List<Exercise>>) {
                allExercises = response.body().orEmpty().sortedBy { it.name.lowercase() }
                seedExistingWorkout()
                renderSelection()
            }

            override fun onFailure(call: Call<List<Exercise>>, t: Throwable) {
                clear()
                exerciseList.removeAllViews()
                empty("Failed to load exercises.")
            }
        })
    }

    private fun seedExistingWorkout() {
        selectedIds.clear()
        configs.clear()
        val availableIds = allExercises.mapNotNull { exerciseId(it) }.toSet()
        edit?.exercises
            .orEmpty()
            .forEach { existing ->
                val id = existing.exerciseId ?: return@forEach
                if (id !in availableIds || id in selectedIds) return@forEach
                selectedIds.add(id)
                configs[id] = ExerciseConfig(existing.sets, existing.repetitions, existing.restInterval)
            }
    }

    private fun renderSelection() {
        detailsStep = false
        rememberName()
        clear()
        exerciseList.removeAllViews()
        findViewById<TextView>(R.id.tvSubtitle).text = "Choose exercises first, then set the details."

        content.addView(TextView(this).apply {
            text = "Step 1 of 2 - Choose exercises"
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#212121"))
            setPadding(0, 0, 0, dp(10))
        })

        val nextButton = MaterialButton(this).apply {
            isAllCaps = false
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E65100"))
            setOnClickListener {
                if (selectedIds.isEmpty()) {
                    AppToast.error(this@CustomWorkoutBuilderActivity, "Choose at least one exercise.")
                    return@setOnClickListener
                }
                renderDetails()
            }
        }
        updateNextButton(nextButton)
        content.addView(nextButton, LinearLayout.LayoutParams(-1, dp(48)))

        allExercises.forEach { exercise ->
            val id = exerciseId(exercise) ?: return@forEach
            exerciseList.addView(selectionCard(exercise, id, nextButton), bottomParams())
        }
    }

    private fun selectionCard(exercise: Exercise, id: Long, nextButton: MaterialButton) =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#FFFFFF", 16)
            setPadding(dp(14), dp(12), dp(14), dp(12))

            addView(CheckBox(context).apply {
                text = exercise.name
                isChecked = id in selectedIds
                textSize = 15f
                setTextColor(Color.parseColor("#212121"))
                setOnCheckedChangeListener { _, checked ->
                    if (checked) {
                        if (id !in selectedIds) selectedIds.add(id)
                        configs.putIfAbsent(id, ExerciseConfig())
                    } else {
                        selectedIds.remove(id)
                    }
                    updateNextButton(nextButton)
                }
            })
            addView(TextView(context).apply {
                text = "${exercise.difficultyLevel ?: "Beginner"} - ${exercise.targetMuscleGroup ?: "Target muscle"}"
                textSize = 12f
                setTextColor(Color.parseColor("#757575"))
            })
        }

    private fun renderDetails() {
        detailsStep = true
        clear()
        exerciseList.removeAllViews()
        findViewById<TextView>(R.id.tvSubtitle).text = "Set reps, rest, and exercise order."

        content.addView(TextView(this).apply {
            text = "Step 2 of 2 - Workout details"
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#212121"))
            setPadding(0, 0, 0, dp(10))
        })

        val input = input(workoutNameDraft, "Workout name")
        nameInput = input
        content.addView(input, LinearLayout.LayoutParams(-1, dp(56)).apply { setMargins(0, 0, 0, dp(8)) })

        content.addView(LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(toolbarButton("Back", "#757575") {
                rememberName()
                renderSelection()
            }, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                setMargins(0, 0, dp(5), 0)
            })
            addView(toolbarButton("Save Workout", "#E65100") { validateAndSave() }, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                setMargins(dp(5), 0, 0, 0)
            })
        }, LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, 0, 0, dp(10)) })

        selectedIds.forEachIndexed { index, id ->
            val exercise = allExercises.firstOrNull { exerciseId(it) == id } ?: return@forEachIndexed
            exerciseList.addView(detailCard(exercise, id, index), bottomParams())
        }
    }

    private fun detailCard(exercise: Exercise, id: Long, index: Int) =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#FFFFFF", 16)
            setPadding(dp(14), dp(12), dp(14), dp(12))
            val config = configs.getOrPut(id) { ExerciseConfig() }

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                addView(TextView(context).apply {
                    text = "${index + 1}. ${exercise.name}"
                    textSize = 15f
                    typeface = Typeface.DEFAULT_BOLD
                    setTextColor(Color.parseColor("#212121"))
                }, LinearLayout.LayoutParams(0, -2, 1f))
                addView(smallButton("Up", index > 0) {
                    swap(index, index - 1)
                })
                addView(smallButton("Down", index < selectedIds.lastIndex) {
                    swap(index, index + 1)
                })
            })

            addView(TextView(context).apply {
                text = "${exercise.difficultyLevel ?: "Beginner"} - ${exercise.targetMuscleGroup ?: "Target muscle"}"
                textSize = 12f
                setTextColor(Color.parseColor("#757575"))
                setPadding(0, dp(2), 0, dp(8))
            })

            addView(LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
                val sets = numberInput(config.sets.toString(), "Sets") { config.sets = it.coerceAtLeast(1) }
                val reps = numberInput(config.repetitions.toString(), "Reps") { config.repetitions = it.coerceAtLeast(1) }
                val rest = numberInput(config.restInterval.toString(), "Rest") { config.restInterval = it.coerceAtLeast(0) }
                addView(sets, LinearLayout.LayoutParams(0, dp(56), 1f).apply { setMargins(0, 0, dp(4), 0) })
                addView(reps, LinearLayout.LayoutParams(0, dp(56), 1f).apply { setMargins(dp(4), 0, dp(4), 0) })
                addView(rest, LinearLayout.LayoutParams(0, dp(56), 1f).apply { setMargins(dp(4), 0, 0, 0) })
            })

            addView(toolbarButton("Remove Exercise", "#B91C1C") {
                selectedIds.remove(id)
                if (selectedIds.isEmpty()) {
                    AppToast.error(this@CustomWorkoutBuilderActivity, "Choose at least one exercise.")
                    renderSelection()
                } else {
                    renderDetails()
                }
            }, LinearLayout.LayoutParams(-1, dp(42)).apply { setMargins(0, dp(8), 0, 0) })
        }

    private fun numberInput(value: String, hint: String, onChanged: (Int) -> Unit) =
        EditText(this).apply {
            setText(value)
            this.hint = hint
            inputType = InputType.TYPE_CLASS_NUMBER
            textSize = 13f
            setSingleLine(true)
            setPadding(dp(8), 0, dp(8), 0)
            background = rounded("#F9F9F9", 10)
            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    onChanged(s?.toString()?.toIntOrNull() ?: 0)
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }

    private fun toolbarButton(text: String, color: String, click: () -> Unit) =
        MaterialButton(this).apply {
            this.text = text
            isAllCaps = false
            textSize = 12f
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor(color))
            setOnClickListener { click() }
        }

    private fun smallButton(text: String, enabled: Boolean, click: () -> Unit) =
        MaterialButton(this).apply {
            this.text = text
            isAllCaps = false
            textSize = 10f
            isEnabled = enabled
            minWidth = dp(54)
            minimumWidth = dp(54)
            minHeight = dp(36)
            minimumHeight = dp(36)
            insetTop = 0
            insetBottom = 0
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor(if (enabled) "#E65100" else "#BDBDBD"))
            setOnClickListener { click() }
        }

    private fun updateNextButton(button: MaterialButton) {
        button.text = if (selectedIds.isEmpty()) "Next" else "Next (${selectedIds.size})"
    }

    private fun swap(from: Int, to: Int) {
        val item = selectedIds.removeAt(from)
        selectedIds.add(to, item)
        renderDetails()
    }

    private fun validateAndSave() {
        rememberName()
        val name = workoutNameDraft.trim()
        if (name.isBlank() || selectedIds.isEmpty()) {
            AppToast.error(this, "Name and exercises are required.")
            return
        }
        save(name)
    }

    private fun rememberName() {
        nameInput?.let { workoutNameDraft = it.text?.toString().orEmpty() }
    }

    private fun save(name: String) {
        val payload = CreateCustomWorkoutRequest(
            name = name,
            exercises = selectedIds.mapIndexed { index, id ->
                val config = configs.getOrPut(id) { ExerciseConfig() }
                CreateWorkoutExercise(
                    exerciseId = id,
                    sets = config.sets.coerceAtLeast(1),
                    repetitions = config.repetitions.coerceAtLeast(1),
                    restInterval = config.restInterval.coerceAtLeast(0),
                    exerciseOrder = index
                )
            }
        )
        val call = if (edit == null) {
            RetrofitClient.api.createCustomWorkout(AuthStore.authHeader(this), payload)
        } else {
            RetrofitClient.api.updateCustomWorkout(AuthStore.authHeader(this), edit?.customWorkoutId ?: edit?.id ?: 0L, payload)
        }
        call.enqueue(object : Callback<CustomWorkout> {
            override fun onResponse(call: Call<CustomWorkout>, response: Response<CustomWorkout>) {
                if (response.isSuccessful) {
                    AppToast.success(this@CustomWorkoutBuilderActivity, "Workout saved.")
                    finish()
                } else {
                    AppToast.error(this@CustomWorkoutBuilderActivity, "Failed to save workout.")
                }
            }

            override fun onFailure(call: Call<CustomWorkout>, t: Throwable) {
                AppToast.error(this@CustomWorkoutBuilderActivity, "Connection error: ${t.message}")
            }
        })
    }

    private fun exerciseId(exercise: Exercise) = exercise.exerciseId ?: exercise.id

    private fun bottomParams() =
        LinearLayout.LayoutParams(-1, -2).apply { setMargins(0, 0, 0, dp(10)) }
}
