package com.hisoler.bodubodu

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.hisoler.bodubodu.network.ApiMessage
import com.hisoler.bodubodu.network.ForgotPasswordRequest
import com.hisoler.bodubodu.network.GoogleAuthRequest
import com.hisoler.bodubodu.network.LoginResponse

class LoginActivity : AppCompatActivity() {
    private lateinit var btnSignIn: MaterialButton
    private lateinit var btnGoogle: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (AuthStore.token(this).isNotBlank()) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }
        setContentView(R.layout.activity_login)

        val etEmail   = findViewById<TextInputEditText>(R.id.etEmail)
        val etPassword = findViewById<TextInputEditText>(R.id.etPassword)
        btnSignIn = findViewById(R.id.btnSignIn)
        btnGoogle = findViewById(R.id.btnGoogle)
        val tvForgotPassword = findViewById<TextView>(R.id.tvForgotPassword)
        val tvSignUp   = findViewById<TextView>(R.id.tvSignUp)

        tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        btnGoogle.setOnClickListener {
            if (getString(R.string.google_web_client_id).startsWith("YOUR_WEB_CLIENT_ID")) {
                AppToast.error(this, "Set google_web_client_id in strings.xml first.")
                return@setOnClickListener
            }
            startActivityForResult(GoogleAuthHelper.signInIntent(this), GoogleAuthHelper.RC_GOOGLE_SIGN_IN)
        }

        tvForgotPassword.setOnClickListener {
            val email = etEmail.text.toString().trim()

            if (email.isEmpty()) {
                etEmail.error = "Enter your email first"
                etEmail.requestFocus()
                return@setOnClickListener
            }

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                etEmail.error = "Enter a valid email"
                etEmail.requestFocus()
                return@setOnClickListener
            }

            tvForgotPassword.isEnabled = false
            tvForgotPassword.text = "Sending reset link..."

            com.hisoler.bodubodu.network.RetrofitClient.api.forgotPassword(ForgotPasswordRequest(email))
                .enqueue(object : retrofit2.Callback<ApiMessage> {
                    override fun onResponse(
                        call: retrofit2.Call<ApiMessage>,
                        response: retrofit2.Response<ApiMessage>
                    ) {
                        tvForgotPassword.isEnabled = true
                        tvForgotPassword.text = "Forgot password?"

                        if (response.isSuccessful) {
                            AppToast.success(
                                this@LoginActivity,
                                "If that email is registered, a reset link has been sent."
                            )
                        } else {
                            AppToast.error(this@LoginActivity, "Could not send reset email. Please try again.")
                        }
                    }

                    override fun onFailure(call: retrofit2.Call<ApiMessage>, t: Throwable) {
                        tvForgotPassword.isEnabled = true
                        tvForgotPassword.text = "Forgot password?"
                        AppToast.error(this@LoginActivity, "Connection error: ${t.message}")
                    }
                })
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

            setLoading(true, "Signing in...")

            val request = com.hisoler.bodubodu.network.LoginRequest(email, password)

            com.hisoler.bodubodu.network.RetrofitClient.api.login(request)
                .enqueue(object : retrofit2.Callback<LoginResponse> {

                    override fun onResponse(
                        call: retrofit2.Call<LoginResponse>,
                        response: retrofit2.Response<LoginResponse>
                    ) {
                        if (response.isSuccessful && response.body()?.token?.isNotBlank() == true) {
                            val token = response.body()!!.token
                            AuthStore.saveToken(this@LoginActivity, token)
                            loadSignedInUser()
                        } else {
                            setLoading(false)
                            val msg = when (response.code()) {
                                401  -> "Invalid email or password."
                                404  -> "Account not found."
                                else -> "Login failed. Please try again."
                            }
                            AppToast.error(this@LoginActivity, msg)
                        }
                    }

                    override fun onFailure(
                        call: retrofit2.Call<LoginResponse>,
                        t: Throwable
                    ) {
                        setLoading(false)
                        AppToast.error(this@LoginActivity, "Connection error: ${t.message}")
                    }
                })
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != GoogleAuthHelper.RC_GOOGLE_SIGN_IN) return
        val credential = GoogleAuthHelper.accountFromResult(data)?.idToken
        if (credential.isNullOrBlank()) {
            AppToast.error(this, "Google sign-in was cancelled.")
            return
        }

        setLoading(true, "Signing in...")
        com.hisoler.bodubodu.network.RetrofitClient.api.googleAuth(GoogleAuthRequest(credential))
            .enqueue(object : retrofit2.Callback<LoginResponse> {
                override fun onResponse(
                    call: retrofit2.Call<LoginResponse>,
                    response: retrofit2.Response<LoginResponse>
                ) {
                    if (response.isSuccessful && response.body()?.token?.isNotBlank() == true) {
                        AuthStore.saveToken(this@LoginActivity, response.body()!!.token)
                        loadSignedInUser()
                    } else {
                        setLoading(false)
                        AppToast.error(this@LoginActivity, "Google authentication failed.")
                    }
                }

                override fun onFailure(call: retrofit2.Call<LoginResponse>, t: Throwable) {
                    setLoading(false)
                    AppToast.error(this@LoginActivity, "Connection error: ${t.message}")
                }
            })
    }

    private fun loadSignedInUser() {
        com.hisoler.bodubodu.network.RetrofitClient.api.me(AuthStore.authHeader(this))
            .enqueue(object : retrofit2.Callback<com.hisoler.bodubodu.network.User> {
                override fun onResponse(
                    call: retrofit2.Call<com.hisoler.bodubodu.network.User>,
                    response: retrofit2.Response<com.hisoler.bodubodu.network.User>
                ) {
                    setLoading(false)

                    if (response.isSuccessful && response.body() != null) {
                        val user = response.body()!!
                        AuthStore.saveUser(this@LoginActivity, user)
                        AppToast.success(this@LoginActivity, "Welcome back, ${user.firstName}!")
                        startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                        finish()
                    } else {
                        AuthStore.clear(this@LoginActivity)
                        AppToast.error(this@LoginActivity, "Could not load your account.")
                    }
                }

                override fun onFailure(
                    call: retrofit2.Call<com.hisoler.bodubodu.network.User>,
                    t: Throwable
                ) {
                    setLoading(false)
                    AuthStore.clear(this@LoginActivity)
                    AppToast.error(this@LoginActivity, "Connection error: ${t.message}")
                }
            })
    }

    private fun setLoading(loading: Boolean, label: String = "Sign In") {
        btnSignIn.isEnabled = !loading
        btnGoogle.isEnabled = !loading
        btnSignIn.text = if (loading) label else "Sign In"
    }
}
