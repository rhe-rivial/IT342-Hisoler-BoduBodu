package com.hisoler.bodubodu

import android.os.Bundle
import com.hisoler.bodubodu.network.RetrofitClient
import com.hisoler.bodubodu.network.WorkoutSession
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class HistoryActivity : BaseScreenActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_history)
        bindScreen()
        clear()
        empty("Loading history...")
        RetrofitClient.api.workoutHistory(AuthStore.authHeader(this)).enqueue(object : Callback<List<WorkoutSession>> {
            override fun onResponse(call: Call<List<WorkoutSession>>, response: Response<List<WorkoutSession>>) {
                render(response.body().orEmpty())
            }
            override fun onFailure(call: Call<List<WorkoutSession>>, t: Throwable) {
                clear()
                empty("Failed to load history.")
            }
        })
    }

    private fun render(history: List<WorkoutSession>) {
        clear()
        statRow(
            "Total" to history.size.toString(),
            "Custom" to history.count { (it.workoutType ?: it.type ?: "").contains("CUSTOM", true) }.toString(),
            "Minutes" to history.sumOf { it.duration ?: 0 }.toString()
        )
        title("Completed Sessions")
        if (history.isEmpty()) empty("No workouts logged yet.")
        history.forEach { workoutRow(it) }
    }
}
