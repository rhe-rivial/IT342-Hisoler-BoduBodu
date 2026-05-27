package com.hisoler.bodubodu

import android.content.Intent
import android.os.Bundle
import com.hisoler.bodubodu.network.DefaultWorkout
import com.hisoler.bodubodu.network.RetrofitClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class WorkoutActivity : BaseScreenActivity() {
    private var query = ""
    private var workoutsCache = emptyList<DefaultWorkout>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_workout)
        bindScreen()
        clear()
        empty("Loading workouts...")
        load()
    }

    private fun load() {
        RetrofitClient.api.defaultWorkouts(AuthStore.authHeader(this)).enqueue(object : Callback<List<DefaultWorkout>> {
            override fun onResponse(call: Call<List<DefaultWorkout>>, response: Response<List<DefaultWorkout>>) {
                workoutsCache = response.body().orEmpty().sortedBy { it.name.lowercase() }
                render()
            }
            override fun onFailure(call: Call<List<DefaultWorkout>>, t: Throwable) {
                clear()
                empty("Failed to load workouts.")
            }
        })
    }

    private fun render() {
        clear()
        val search = searchBox("Search default workouts") {
            query = it.trim()
            render()
        }
        if (query.isNotBlank()) setSearchText(search, query)
        val workouts = workoutsCache.filter { workout ->
            val text = buildString {
                append(workout.name).append(" ")
                append(workout.description.orEmpty()).append(" ")
                append(workout.exercises.joinToString(" ") { exerciseName(it) })
            }.lowercase()
            query.isBlank() || text.contains(query.lowercase())
        }
        if (workouts.isEmpty()) empty("No default workouts found.")
        workouts.forEach { workout ->
            card {
                bold(workout.name)
                small("${workout.difficultyLevel ?: "Beginner"} - ${workout.exercises.size} exercises")
                if (!workout.description.isNullOrBlank()) body(workout.description)
                button("Open Workout") {
                    WorkoutCache.defaultWorkout = workout
                    WorkoutCache.customWorkout = null
                    startActivity(Intent(this@WorkoutActivity, WorkoutDetailActivity::class.java))
                }
            }
        }
    }
}
