package com.hisoler.bodubodu

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Patterns
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.hisoler.bodubodu.network.GoogleAuthRequest
import com.hisoler.bodubodu.network.LoginResponse

class RegisterActivity : AppCompatActivity() {

    private lateinit var tilFirstName: TextInputLayout
    private lateinit var tilLastName: TextInputLayout
    private lateinit var tilEmail: TextInputLayout
    private lateinit var tilPassword: TextInputLayout
    private lateinit var tilConfirmPassword: TextInputLayout

    private lateinit var etFirstName: TextInputEditText
    private lateinit var etLastName: TextInputEditText
    private lateinit var etEmail: TextInputEditText
    private lateinit var etPassword: TextInputEditText
    private lateinit var etConfirmPassword: TextInputEditText

    private lateinit var btnRegister: MaterialButton
    private lateinit var btnGoogle: MaterialButton
    private lateinit var tvLogin: TextView
    private lateinit var tvPasswordStrength: TextView

    private lateinit var strengthBar1: View
    private lateinit var strengthBar2: View
    private lateinit var strengthBar3: View
    private lateinit var strengthBar4: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        tilFirstName       = findViewById(R.id.tilFirstName)
        tilLastName        = findViewById(R.id.tilLastName)
        tilEmail           = findViewById(R.id.tilEmail)
        tilPassword        = findViewById(R.id.tilPassword)
        tilConfirmPassword = findViewById(R.id.tilConfirmPassword)

        etFirstName        = findViewById(R.id.etFirstName)
        etLastName         = findViewById(R.id.etLastName)
        etEmail            = findViewById(R.id.etEmail)
        etPassword         = findViewById(R.id.etPassword)
        etConfirmPassword  = findViewById(R.id.etConfirmPassword)

        btnRegister        = findViewById(R.id.btnRegister)
        btnGoogle          = findViewById(R.id.btnGoogle)
        tvLogin            = findViewById(R.id.tvLogin)
        tvPasswordStrength = findViewById(R.id.tvPasswordStrength)

        strengthBar1       = findViewById(R.id.strengthBar1)
        strengthBar2       = findViewById(R.id.strengthBar2)
        strengthBar3       = findViewById(R.id.strengthBar3)
        strengthBar4       = findViewById(R.id.strengthBar4)

        tvLogin.setOnClickListener { finish() }

        etFirstName.setOnFocusChangeListener { _, _ -> tilFirstName.error = null }
        etLastName.setOnFocusChangeListener  { _, _ -> tilLastName.error  = null }
        etEmail.setOnFocusChangeListener     { _, _ -> tilEmail.error     = null }

        etConfirmPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                tilConfirmPassword.error = null
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        etPassword.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                tilPassword.error = null
                updatePasswordStrength(s?.toString() ?: "")
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        btnRegister.setOnClickListener {
            if (validateAll()) submitRegistration()
        }

        btnGoogle.setOnClickListener {
            if (getString(R.string.google_web_client_id).startsWith("YOUR_WEB_CLIENT_ID")) {
                AppToast.error(this, "Set google_web_client_id in strings.xml first.")
                return@setOnClickListener
            }
            startActivityForResult(GoogleAuthHelper.signInIntent(this), GoogleAuthHelper.RC_GOOGLE_SIGN_IN)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != GoogleAuthHelper.RC_GOOGLE_SIGN_IN) return
        val credential = GoogleAuthHelper.accountFromResult(data)?.idToken
        if (credential.isNullOrBlank()) {
            AppToast.error(this, "Google sign-up was cancelled.")
            return
        }

        btnGoogle.isEnabled = false
        btnRegister.isEnabled = false

        com.hisoler.bodubodu.network.RetrofitClient.api.googleAuth(GoogleAuthRequest(credential))
            .enqueue(object : retrofit2.Callback<LoginResponse> {
                override fun onResponse(
                    call: retrofit2.Call<LoginResponse>,
                    response: retrofit2.Response<LoginResponse>
                ) {
                    btnGoogle.isEnabled = true
                    btnRegister.isEnabled = true

                    if (response.isSuccessful && response.body()?.token?.isNotBlank() == true) {
                        AuthStore.saveToken(this@RegisterActivity, response.body()!!.token)
                        loadGoogleUser()
                    } else {
                        AppToast.error(this@RegisterActivity, "Google authentication failed.")
                    }
                }

                override fun onFailure(call: retrofit2.Call<LoginResponse>, t: Throwable) {
                    btnGoogle.isEnabled = true
                    btnRegister.isEnabled = true
                    AppToast.error(this@RegisterActivity, "Connection error: ${t.message}")
                }
            })
    }

    private fun loadGoogleUser() {
        com.hisoler.bodubodu.network.RetrofitClient.api.me(AuthStore.authHeader(this))
            .enqueue(object : retrofit2.Callback<com.hisoler.bodubodu.network.User> {
                override fun onResponse(
                    call: retrofit2.Call<com.hisoler.bodubodu.network.User>,
                    response: retrofit2.Response<com.hisoler.bodubodu.network.User>
                ) {
                    response.body()?.let { AuthStore.saveUser(this@RegisterActivity, it) }
                    AppToast.success(this@RegisterActivity, "Welcome to BoduBodu!")
                    startActivity(android.content.Intent(this@RegisterActivity, DashboardActivity::class.java))
                    finish()
                }

                override fun onFailure(call: retrofit2.Call<com.hisoler.bodubodu.network.User>, t: Throwable) {
                    AppToast.error(this@RegisterActivity, "Connection error: ${t.message}")
                }
            })
    }

    private fun validateAll(): Boolean {
        var valid = true

        val firstName       = etFirstName.text.toString().trim()
        val lastName        = etLastName.text.toString().trim()
        val email           = etEmail.text.toString().trim()
        val password        = etPassword.text.toString()
        val confirmPassword = etConfirmPassword.text.toString()

        if (firstName.isEmpty()) {
            tilFirstName.error = "First name is required"; valid = false
        } else if (firstName.length < 2) {
            tilFirstName.error = "Must be at least 2 characters"; valid = false
        }

        if (lastName.isEmpty()) {
            tilLastName.error = "Last name is required"; valid = false
        } else if (lastName.length < 2) {
            tilLastName.error = "Must be at least 2 characters"; valid = false
        }

        if (email.isEmpty()) {
            tilEmail.error = "Email is required"; valid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            tilEmail.error = "Enter a valid email address"; valid = false
        }

        if (password.isEmpty()) {
            tilPassword.error = "Password is required"; valid = false
        } else if (password.length < 6) {
            tilPassword.error = "Minimum 6 characters required"; valid = false
        }

        if (confirmPassword.isEmpty()) {
            tilConfirmPassword.error = "Please confirm your password"; valid = false
        } else if (password != confirmPassword) {
            tilConfirmPassword.error = "Passwords do not match"; valid = false
        }

        return valid
    }

    private fun updatePasswordStrength(password: String) {
        val bars = listOf(strengthBar1, strengthBar2, strengthBar3, strengthBar4)
        val strength = calcStrength(password)

        val (color, label) = when {
            password.isEmpty() -> Pair("#E0E0E0", "Use at least 6 characters")
            strength == 1      -> Pair("#F44336", "Weak — add numbers or symbols")
            strength == 2      -> Pair("#FF9800", "Fair — try mixing cases")
            strength == 3      -> Pair("#FFC107", "Good — almost there!")
            else               -> Pair("#4CAF50", "Strong password ✓")
        }

        bars.forEachIndexed { index, bar ->
            bar.setBackgroundColor(
                if (index < strength) Color.parseColor(color)
                else Color.parseColor("#E0E0E0")
            )
        }

        tvPasswordStrength.text = label
        tvPasswordStrength.setTextColor(
            if (password.isEmpty()) Color.parseColor("#9E9E9E")
            else Color.parseColor(color)
        )
    }

    private fun calcStrength(password: String): Int {
        if (password.length < 6) return if (password.isEmpty()) 0 else 1
        var score = 1
        if (password.length >= 8) score++
        if (password.any { it.isDigit() } && password.any { it.isLetter() }) score++
        if (password.any { !it.isLetterOrDigit() }) score++
        return score.coerceAtMost(4)
    }

    private fun submitRegistration() {
        val firstName = etFirstName.text.toString().trim()
        val lastName  = etLastName.text.toString().trim()
        val email     = etEmail.text.toString().trim()
        val password  = etPassword.text.toString()

        btnRegister.isEnabled = false
        btnRegister.text = "Creating account..."

        val request = com.hisoler.bodubodu.network.RegisterRequest(
            firstName, lastName, email, password
        )

        com.hisoler.bodubodu.network.RetrofitClient.api.register(request)
            .enqueue(object : retrofit2.Callback<Void> {

                override fun onResponse(
                    call: retrofit2.Call<Void>,
                    response: retrofit2.Response<Void>
                ) {
                    btnRegister.isEnabled = true
                    btnRegister.text = "Create Account"

                    if (response.isSuccessful) {
                        AppToast.success(
                            this@RegisterActivity,
                            "User registered successfully."
                        )
                        finish()
                    } else {
                        val msg = when (response.code()) {
                            409  -> "This email is already registered."
                            400  -> "Invalid information. Check your details."
                            500  -> "Server error. Please try again later."
                            else -> "Registration failed (${response.code()})."
                        }
                        AppToast.error(this@RegisterActivity, msg)
                    }
                }

                override fun onFailure(call: retrofit2.Call<Void>, t: Throwable) {
                    btnRegister.isEnabled = true
                    btnRegister.text = "Create Account"
                    AppToast.error(this@RegisterActivity, "Connection error: ${t.message}")
                }
            })
    }
}
