package com.hisoler.bodubodu

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.widget.LinearLayout
import com.hisoler.bodubodu.network.*
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ProfileActivity : BaseScreenActivity() {
    private var user: User? = null
    private var stats: DashboardStats = DashboardStats()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        bindScreen()
        render()
        load()
    }

    private fun load() {
        RetrofitClient.api.me(AuthStore.authHeader(this)).enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                user = response.body()
                user?.let { AuthStore.saveUser(this@ProfileActivity, it) }
                render()
            }
            override fun onFailure(call: Call<User>, t: Throwable) {}
        })
        RetrofitClient.api.dashboardStats(AuthStore.authHeader(this)).enqueue(object : Callback<DashboardStats> {
            override fun onResponse(call: Call<DashboardStats>, response: Response<DashboardStats>) {
                stats = response.body() ?: DashboardStats()
                render()
            }
            override fun onFailure(call: Call<DashboardStats>, t: Throwable) {}
        })
    }

    private fun render() {
        val current = user ?: AuthStore.user(this)
        clear()
        card {
            bold("${current.firstName} ${current.lastName}".trim(), 20)
            small(current.email)
            small("Member since ${formatDate(current.createdAt)}")
            button("Edit Account") { editProfile(current) }
        }
        title("Fitness Summary")
        statRow(
            "Workouts" to stats.totalWorkouts.toString(),
            "Minutes" to stats.totalMinutes.toString(),
            "Streak" to "${stats.currentStreak}d"
        )
        card {
            button("Sign Out", "#B91C1C") {
                AuthStore.clear(this@ProfileActivity)
                startActivity(Intent(this@ProfileActivity, LoginActivity::class.java))
                finish()
            }
        }
    }

    private fun editProfile(current: User) {
        clear()
        val first = input(current.firstName, "First name")
        val last = input(current.lastName, "Last name")
        val email = input(current.email, "Email")
        val currentPassword = input("", "Current password")
        val newPassword = input("", "New password")
        currentPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        newPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD

        listOf(first, last, email, currentPassword, newPassword).forEach {
            content.addView(it, LinearLayout.LayoutParams(-1, dp(56)))
        }
        card {
            button("Save") {
                val request = UpdateUserRequest(
                    first.text.toString().trim(),
                    last.text.toString().trim(),
                    email.text.toString().trim(),
                    currentPassword.text.toString().ifBlank { null },
                    newPassword.text.toString().ifBlank { null }
                )
                RetrofitClient.api.updateMe(AuthStore.authHeader(this@ProfileActivity), request).enqueue(object : Callback<User> {
                    override fun onResponse(call: Call<User>, response: Response<User>) {
                        if (response.isSuccessful && response.body() != null) {
                            user = response.body()
                            AuthStore.saveUser(this@ProfileActivity, response.body()!!)
                            AppToast.success(this@ProfileActivity, "Account updated.")
                            render()
                        } else AppToast.error(this@ProfileActivity, "Failed to update account.")
                    }
                    override fun onFailure(call: Call<User>, t: Throwable) {
                        AppToast.error(this@ProfileActivity, "Connection error: ${t.message}")
                    }
                })
            }
            button("Cancel", "#757575") { render() }
        }
    }
}
