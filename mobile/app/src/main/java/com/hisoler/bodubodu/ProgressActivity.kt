package com.hisoler.bodubodu

import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.widget.GridLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.hisoler.bodubodu.network.DashboardStats
import com.hisoler.bodubodu.network.RetrofitClient
import com.hisoler.bodubodu.network.WorkoutSession
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class ProgressActivity : BaseScreenActivity() {
    private var stats = DashboardStats()
    private var history = emptyList<WorkoutSession>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_progress)
        bindScreen()
        clear()
        empty("Loading progress...")
        load()
    }

    private fun load() {
        RetrofitClient.api.dashboardStats(AuthStore.authHeader(this)).enqueue(object : Callback<DashboardStats> {
            override fun onResponse(call: Call<DashboardStats>, response: Response<DashboardStats>) {
                stats = response.body() ?: DashboardStats()
                render()
            }
            override fun onFailure(call: Call<DashboardStats>, t: Throwable) {
                render()
            }
        })
        RetrofitClient.api.workoutHistory(AuthStore.authHeader(this)).enqueue(object : Callback<List<WorkoutSession>> {
            override fun onResponse(call: Call<List<WorkoutSession>>, response: Response<List<WorkoutSession>>) {
                history = response.body().orEmpty()
                render()
            }
            override fun onFailure(call: Call<List<WorkoutSession>>, t: Throwable) {
                render()
            }
        })
    }

    private fun render() {
        clear()
        statRow(
            "Workouts" to stats.totalWorkouts.toString(),
            "This Week" to stats.workoutsThisWeek.toString(),
            "Minutes" to stats.totalMinutes.toString()
        )
        statRow(
            "Exercises" to stats.totalExercises.toString(),
            "Streak" to "${stats.currentStreak}d",
            "Best" to "${stats.longestStreak}d"
        )
        title("Summary")
        card {
            body("You have completed ${stats.totalWorkouts} workouts and ${stats.totalMinutes} minutes of training.")
        }
        title("Workout Calendar")
        renderCalendar()
    }

    private fun renderCalendar() {
        val workedDates = history.mapNotNull { dateKey(it.completedAt) }.toSet()
        val today = Calendar.getInstance()
        val cal = Calendar.getInstance()
        cal.set(Calendar.DAY_OF_MONTH, 1)
        val monthTitle = SimpleDateFormat("MMMM yyyy", Locale.US).format(cal.time)
        centeredCard {
            addView(TextView(context).apply {
                text = monthTitle
                textSize = 16f
                typeface = Typeface.DEFAULT_BOLD
                setTextColor(Color.parseColor("#212121"))
                gravity = Gravity.CENTER
                setPadding(0, 0, 0, dp(10))
            })
            val grid = GridLayout(context).apply {
                columnCount = 7
                rowCount = 7
            }
            listOf("S", "M", "T", "W", "T", "F", "S").forEach {
                grid.addView(dayLabel(it))
            }
            repeat(cal.get(Calendar.DAY_OF_WEEK) - 1) {
                grid.addView(dayCell("", false, false))
            }
            val maxDay = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
            for (day in 1..maxDay) {
                cal.set(Calendar.DAY_OF_MONTH, day)
                val key = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.time)
                val isToday = day == today.get(Calendar.DAY_OF_MONTH) &&
                    cal.get(Calendar.MONTH) == today.get(Calendar.MONTH) &&
                    cal.get(Calendar.YEAR) == today.get(Calendar.YEAR)
                grid.addView(dayCell(day.toString(), workedDates.contains(key), isToday))
            }
            addView(grid)
        }
    }

    private fun dayLabel(text: String) =
        TextView(this).apply {
            this.text = text
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.GRAY)
            gravity = Gravity.CENTER
        }.also {
            it.layoutParams = GridLayout.LayoutParams().apply {
                width = dp(38)
                height = dp(30)
            }
        }

    private fun dayCell(text: String, worked: Boolean, today: Boolean) =
        TextView(this).apply {
            this.text = text
            textSize = 13f
            gravity = Gravity.CENTER
            setTextColor(if (worked) Color.WHITE else Color.parseColor("#212121"))
            val bg = rounded(if (worked) "#E65100" else "#FFFFFF", 20)
            if (today) bg.setStroke(dp(2), Color.parseColor("#E65100"))
            background = bg
        }.also {
            it.layoutParams = GridLayout.LayoutParams().apply {
                width = dp(38)
                height = dp(38)
                setMargins(dp(2), dp(2), dp(2), dp(2))
            }
        }

    private fun dateKey(raw: String?): String? {
        if (raw.isNullOrBlank()) return null
        return raw.take(10).takeIf { it.length == 10 }
    }
}
