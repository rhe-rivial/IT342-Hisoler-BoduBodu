package com.hisoler.bodubodu

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText

class LoginActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val etEmail   = findViewById<TextInputEditText>(R.id.etEmail)
        val etPassword = findViewById<TextInputEditText>(R.id.etPassword)
        val btnSignIn  = findViewById<MaterialButton>(R.id.btnSignIn)
        val tvSignUp   = findViewById<TextView>(R.id.tvSignUp)

        tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        btnSignIn.setOnClickListener {

            val email    = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isEmpty()) {
                etEmail.error = "Email is required"
                etEmail.requestFocus()
                return@setOnClickListener
            }

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                etEmail.error = "Enter a valid email"
                etEmail.requestFocus()
                return@setOnClickListener
            }

            if (password.isEmpty()) {
                etPassword.error = "Password is required"
                etPassword.requestFocus()
                return@setOnClickListener
            }

            if (password.length < 6) {
                etPassword.error = "Minimum 6 characters"
                etPassword.requestFocus()
                return@setOnClickListener
            }

            btnSignIn.isEnabled = false
            btnSignIn.text = "Signing in..."

            val request = com.hisoler.bodubodu.network.LoginRequest(email, password)

            com.hisoler.bodubodu.network.RetrofitClient.api.login(request)
                .enqueue(object : retrofit2.Callback<com.hisoler.bodubodu.network.User> {

                    override fun onResponse(
                        call: retrofit2.Call<com.hisoler.bodubodu.network.User>,
                        response: retrofit2.Response<com.hisoler.bodubodu.network.User>
                    ) {
                        btnSignIn.isEnabled = true
                        btnSignIn.text = "Sign In"

                        if (response.isSuccessful) {
                            val user = response.body()!!

                            AppToast.success(
                                this@LoginActivity,
                                "Welcome back, ${user.firstName}!"
                            )

                            val intent = Intent(this@LoginActivity, DashboardActivity::class.java)
                            intent.putExtra("firstName", user.firstName)
                            intent.putExtra("lastName",  user.lastName)
                            intent.putExtra("email",     user.email)
                            startActivity(intent)
                            finish()

                        } else {
                            val msg = when (response.code()) {
                                401  -> "Invalid email or password."
                                404  -> "Account not found."
                                else -> "Login failed. Please try again."
                            }
                            AppToast.error(this@LoginActivity, msg)
                        }
                    }

                    override fun onFailure(
                        call: retrofit2.Call<com.hisoler.bodubodu.network.User>,
                        t: Throwable
                    ) {
                        btnSignIn.isEnabled = true
                        btnSignIn.text = "Sign In"
                        AppToast.error(this@LoginActivity, "Connection error: ${t.message}")
                    }
                })
        }
    }
}