package com.hisoler.bodubodu

import android.content.Context
import com.hisoler.bodubodu.network.User

object AuthStore {
    private const val PREFS = "bodubodu_auth"
    private const val TOKEN = "token"
    private const val FIRST_NAME = "firstName"
    private const val LAST_NAME = "lastName"
    private const val EMAIL = "email"
    private const val ROLE = "role"
    private const val CREATED_AT = "createdAt"

    fun saveToken(context: Context, token: String) {
        prefs(context).edit().putString(TOKEN, token).apply()
    }

    fun saveUser(context: Context, user: User) {
        prefs(context).edit()
            .putString(FIRST_NAME, user.firstName)
            .putString(LAST_NAME, user.lastName)
            .putString(EMAIL, user.email)
            .putString(ROLE, user.role.orEmpty())
            .putString(CREATED_AT, user.createdAt.orEmpty())
            .apply()
    }

    fun token(context: Context): String = prefs(context).getString(TOKEN, "").orEmpty()

    fun authHeader(context: Context): String = "Bearer ${token(context)}"

    fun user(context: Context): User {
        val p = prefs(context)
        return User(
            id = 0L,
            firstName = p.getString(FIRST_NAME, "User").orEmpty().ifBlank { "User" },
            lastName = p.getString(LAST_NAME, "").orEmpty(),
            email = p.getString(EMAIL, "").orEmpty(),
            role = p.getString(ROLE, "").orEmpty(),
            createdAt = p.getString(CREATED_AT, "").orEmpty()
        )
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
