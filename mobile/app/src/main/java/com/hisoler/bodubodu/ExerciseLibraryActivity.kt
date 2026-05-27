package com.hisoler.bodubodu

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.google.android.material.button.MaterialButton
import com.hisoler.bodubodu.network.Exercise
import com.hisoler.bodubodu.network.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ExerciseLibraryActivity : BaseScreenActivity() {
    private val filters = listOf("All", "Chest", "Core", "Legs", "Back", "Arms", "Glutes", "Full Body")
    private var selectedFilter = "All"
    private var allExercises = emptyList<Exercise>()
    private var query = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_exercise_library)
        bindScreen()
        clear()
        empty("Loading exercises...")
        RetrofitClient.api.exercises().enqueue(object : Callback<List<Exercise>> {
            override fun onResponse(call: Call<List<Exercise>>, response: Response<List<Exercise>>) {
                allExercises = response.body().orEmpty().sortedBy { it.name.lowercase() }
                render()
            }
            override fun onFailure(call: Call<List<Exercise>>, t: Throwable) {
                clear()
                empty("Failed to load exercises.")
            }
        })
    }

    private fun render() {
        clear()
        val search = searchBox("Search exercises") {
            query = it.trim()
            render()
        }
        if (query.isNotBlank()) setSearchText(search, query)
        renderFilters()
        val exercises = allExercises.filter {
            val matchesFilter = selectedFilter == "All" || (it.targetMuscleGroup ?: "").equals(selectedFilter, ignoreCase = true)
            val haystack = "${it.name} ${it.description.orEmpty()} ${it.targetMuscleGroup.orEmpty()} ${it.difficultyLevel.orEmpty()}".lowercase()
            val matchesSearch = query.isBlank() || haystack.contains(query.lowercase())
            matchesFilter && matchesSearch
        }
        if (exercises.isEmpty()) empty("No exercises found.")
        exercises.groupBy { it.targetMuscleGroup ?: "Other" }.forEach { (group, list) ->
            title(group)
            list.chunked(2).forEach { pair ->
                val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
                pair.forEach { exercise ->
                    row.addView(exerciseTile(exercise), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                        setMargins(dp(4), dp(4), dp(4), dp(8))
                    })
                }
                if (pair.size == 1) {
                    row.addView(TextView(this), LinearLayout.LayoutParams(0, 1, 1f).apply {
                        setMargins(dp(4), dp(4), dp(4), dp(8))
                    })
                }
                content.addView(row)
            }
        }
    }

    private fun exerciseTile(exercise: Exercise): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#FFFFFF", 16)
            setPadding(dp(12), dp(12), dp(12), dp(12))
            addView(TextView(context).apply {
                text = exercise.name
                textSize = 15f
                setTextColor(Color.parseColor("#212121"))
                setTypeface(typeface, android.graphics.Typeface.BOLD)
            })
            difficultyBadge(exercise.difficultyLevel ?: "Beginner")
            addView(TextView(context).apply {
                text = exercise.targetMuscleGroup ?: "Target muscle"
                textSize = 11f
                setTextColor(Color.parseColor("#757575"))
                setPadding(0, dp(3), 0, dp(6))
            })
            if (!exercise.description.isNullOrBlank()) {
                addView(TextView(context).apply {
                    text = exercise.description
                    textSize = 12f
                    maxLines = 3
                    setTextColor(Color.parseColor("#424242"))
                    setPadding(0, 0, 0, dp(8))
                })
            }
            addView(MaterialButton(context).apply {
                text = "View"
                textSize = 11f
                isAllCaps = false
                setTextColor(Color.WHITE)
                backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E65100"))
                setOnClickListener {
                    WorkoutCache.exercise = exercise
                    startActivity(Intent(this@ExerciseLibraryActivity, ExerciseDetailActivity::class.java))
                }
            }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(42)))
        }
    }

    private fun renderFilters() {
        val scroll = HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false }
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        filters.forEach { filter ->
            val params = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, dp(42)).apply {
                setMargins(0, 0, dp(8), dp(8))
            }
            row.addView(MaterialButton(this).apply {
                text = filter
                textSize = 12f
                isAllCaps = false
                setTextColor(if (selectedFilter == filter) Color.WHITE else Color.parseColor("#E65100"))
                backgroundTintList = ColorStateList.valueOf(if (selectedFilter == filter) Color.parseColor("#E65100") else Color.WHITE)
                setOnClickListener {
                    selectedFilter = filter
                    render()
                }
            }, params)
        }
        scroll.addView(row)
        content.addView(scroll)
    }

    private fun LinearLayout.difficultyBadge(level: String) {
        val color = when {
            level.contains("adv", true) -> "#FEE2E2" to "#DC2626"
            level.contains("int", true) -> "#FEF3C7" to "#D97706"
            else -> "#DCFCE7" to "#16A34A"
        }
        addView(TextView(context).apply {
            text = level
            textSize = 11f
            setTextColor(Color.parseColor(color.second))
            background = rounded(color.first, 10)
            setPadding(dp(10), dp(4), dp(10), dp(4))
        })
    }
}
