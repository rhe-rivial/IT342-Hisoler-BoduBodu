package com.hisoler.bodubodu

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class DashboardActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        val tvAvatar = findViewById<TextView>(R.id.tvAvatar)

        val firstName = intent.getStringExtra("firstName") ?: "User"
        val lastName = intent.getStringExtra("lastName") ?: ""

        tvWelcome.text = "Welcome, $firstName!"

        // Set avatar initial
        val initial = firstName.firstOrNull()?.uppercaseChar()?.toString() ?: "U"
        tvAvatar.text = initial
    }
}