package com.hisoler.bodubodu

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.LinearLayout
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.hisoler.bodubodu.network.CustomWorkout
import com.hisoler.bodubodu.network.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class CustomWorkoutActivity : BaseScreenActivity() {
    companion object {
        private const val TAG = "CustomWorkoutActivity"
    }

    private var sortBy = "date"
    private var workoutsCache = emptyList<CustomWorkout>()
    private var query = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_custom_workout)
        bindScreen()
        findViewById<FloatingActionButton>(R.id.fabCreate).setOnClickListener { openBuilder(null) }
        renderSortButtons()
        load()
    }

    override fun onResume() {
        super.onResume()
        if (isScreenReady()) load()
    }

    private fun load() {
        clear()
        empty("Loading custom workouts...")
        RetrofitClient.api.customWorkouts(AuthStore.authHeader(this)).enqueue(object : Callback<List<CustomWorkout>> {
            override fun onResponse(call: Call<List<CustomWorkout>>, response: Response<List<CustomWorkout>>) {
                if (!response.isSuccessful) {
                    val error = response.errorBody()?.string().orEmpty()
                    Log.e(TAG, "Custom workouts failed: ${response.code()} $error")
                    clear()
                    empty(
                        when (response.code()) {
                            401, 403 -> "Please log in again to see your custom workouts."
                            else -> "Failed to load custom workouts. (${response.code()})"
                        }
                    )
                    return
                }
                val body = response.body()
                if (body == null) {
                    Log.e(TAG, "Custom workouts response body was empty")
                    clear()
                    empty("Failed to load custom workouts.")
                    return
                }
                workoutsCache = body
                Log.d(TAG, "Loaded ${workoutsCache.size} custom workouts for ${AuthStore.user(this@CustomWorkoutActivity).email}")
                render()
            }

            override fun onFailure(call: Call<List<CustomWorkout>>, t: Throwable) {
                Log.e(TAG, "Custom workouts request failed", t)
                clear()
                empty("Failed to load custom workouts.")
            }
        })
    }

    private fun render() {
        clear()
        val search = searchBox("Search custom workouts") {
            query = it.trim()
            render()
        }
        if (query.isNotBlank()) setSearchText(search, query)
        val workouts = when (sortBy) {
            "alpha" -> workoutsCache.sortedBy { it.name.lowercase() }
            else -> workoutsCache.sortedByDescending { it.createdAt ?: "" }
        }.filter { workout ->
            val haystack = "${workout.name} ${workout.exercises.joinToString(" ") { exerciseName(it) }}".lowercase()
            query.isBlank() || haystack.contains(query.lowercase())
        }
        if (workouts.isEmpty()) {
            val email = AuthStore.user(this).email
            empty(if (email.isBlank()) "No custom workouts yet." else "No custom workouts yet for $email.")
        }
        workouts.forEach { workout ->
            card {
                bold(workout.name)
                small("${workout.exercises.size} exercises - ${formatDate(workout.createdAt)}")
                body(workout.exercises.take(3).joinToString(", ") { exerciseName(it) }.ifBlank { "No exercises yet." })
                customActions(workout)
            }
        }
    }

    private fun LinearLayout.customActions(workout: CustomWorkout) {
        val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
        row.addView(rowButton("Open", "#E65100") {
            WorkoutCache.customWorkout = workout
            WorkoutCache.defaultWorkout = null
            startActivity(Intent(this@CustomWorkoutActivity, WorkoutDetailActivity::class.java))
        }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(0, 0, dp(4), 0) })
        row.addView(rowButton("Edit", "#757575") { openBuilder(workout) }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(4), 0, dp(4), 0) })
        row.addView(rowButton("Delete", "#B91C1C") {
            confirm("Delete Workout", "Delete \"${workout.name}\"?") {
                RetrofitClient.api.deleteCustomWorkout(AuthStore.authHeader(this@CustomWorkoutActivity), workout.customWorkoutId ?: workout.id ?: 0L)
                    .enqueue(object : Callback<Void> {
                        override fun onResponse(call: Call<Void>, response: Response<Void>) {
                            AppToast.success(this@CustomWorkoutActivity, "Workout deleted.")
                            load()
                        }
                        override fun onFailure(call: Call<Void>, t: Throwable) {
                            AppToast.error(this@CustomWorkoutActivity, "Failed to delete workout.")
                        }
                    })
            }
        }, LinearLayout.LayoutParams(0, dp(44), 1f).apply { setMargins(dp(4), 0, 0, 0) })
        addView(row)
    }

    private fun rowButton(text: String, color: String, click: () -> Unit) =
        MaterialButton(this).apply {
            this.text = text
            textSize = 11f
            isAllCaps = false
            setTextColor(Color.WHITE)
            backgroundTintList = ColorStateList.valueOf(Color.parseColor(color))
            setOnClickListener { click() }
        }

    private fun renderSortButtons() {
        val sortRow = findViewById<LinearLayout>(R.id.sortRow)
        sortRow.removeAllViews()
        sortRow.addView(sortButton("Date Made", "date"), LinearLayout.LayoutParams(0, dp(42), 1f).apply { setMargins(0, 0, dp(6), 0) })
        sortRow.addView(sortButton("Alphabetical", "alpha"), LinearLayout.LayoutParams(0, dp(42), 1f).apply { setMargins(dp(6), 0, 0, 0) })
    }

    private fun sortButton(label: String, mode: String) =
        MaterialButton(this).apply {
            text = label
            textSize = 12f
            isAllCaps = false
            setTextColor(if (sortBy == mode) Color.WHITE else Color.parseColor("#E65100"))
            backgroundTintList = ColorStateList.valueOf(if (sortBy == mode) Color.parseColor("#E65100") else Color.WHITE)
            setOnClickListener {
                sortBy = mode
                renderSortButtons()
                render()
            }
        }

    private fun openBuilder(workout: CustomWorkout?) {
        WorkoutCache.customWorkout = workout
        startActivity(Intent(this, CustomWorkoutBuilderActivity::class.java))
    }
}
