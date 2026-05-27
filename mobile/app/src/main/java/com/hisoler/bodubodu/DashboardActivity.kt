package com.hisoler.bodubodu

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import com.hisoler.bodubodu.network.DashboardStats
import com.hisoler.bodubodu.network.RetrofitClient
import com.hisoler.bodubodu.network.User
import com.hisoler.bodubodu.network.WorkoutSession
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DashboardActivity : BaseScreenActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)
        bindScreen()
        findViewById<TextView>(R.id.tvWelcome).text = "Welcome, ${AuthStore.user(this).firstName}!"
        renderLoading()
        load()
    }

    private fun renderLoading() {
        clear()
        empty("Loading your dashboard...")
    }

    private fun load() {
        RetrofitClient.api.me(AuthStore.authHeader(this)).enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                response.body()?.let {
                    AuthStore.saveUser(this@DashboardActivity, it)
                    findViewById<TextView>(R.id.tvWelcome).text = "Welcome, ${it.firstName}!"
                }
            }
            override fun onFailure(call: Call<User>, t: Throwable) {}
        })

        RetrofitClient.api.dashboardStats(AuthStore.authHeader(this)).enqueue(object : Callback<DashboardStats> {
            override fun onResponse(call: Call<DashboardStats>, response: Response<DashboardStats>) {
                render(response.body() ?: DashboardStats(), emptyList())
                loadRecent(response.body() ?: DashboardStats())
            }
            override fun onFailure(call: Call<DashboardStats>, t: Throwable) {
                render(DashboardStats(), emptyList())
            }
        })
    }

    private fun loadRecent(stats: DashboardStats) {
        RetrofitClient.api.recentWorkouts(AuthStore.authHeader(this), 5).enqueue(object : Callback<List<WorkoutSession>> {
            override fun onResponse(call: Call<List<WorkoutSession>>, response: Response<List<WorkoutSession>>) {
                render(stats, response.body().orEmpty())
            }
            override fun onFailure(call: Call<List<WorkoutSession>>, t: Throwable) {
                render(stats, emptyList())
            }
        })
    }

    private fun render(stats: DashboardStats, recent: List<WorkoutSession>) {
        clear()
        statRow(
            "Workouts" to stats.totalWorkouts.toString(),
            "Minutes" to stats.totalMinutes.toString(),
            "Streak" to "${stats.currentStreak}d"
        )
        title("Quick Actions")
        actionRow(
            "Workout" to { startActivity(Intent(this@DashboardActivity, WorkoutActivity::class.java)) },
            "Library" to { startActivity(Intent(this@DashboardActivity, ExerciseLibraryActivity::class.java)) },
            "Custom" to { startActivity(Intent(this@DashboardActivity, CustomWorkoutActivity::class.java)) },
            "Progress" to { startActivity(Intent(this@DashboardActivity, ProgressActivity::class.java)) }
        )
        title("Recent Workouts")
        if (recent.isEmpty()) empty("No workouts logged yet.")
        recent.forEach { workoutRow(it) }
    }
}
