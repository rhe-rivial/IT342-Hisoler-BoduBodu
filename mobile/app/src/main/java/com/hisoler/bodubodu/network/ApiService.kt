package com.hisoler.bodubodu.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String
)

data class User(
    val id: Long,
    val firstName: String,
    val lastName: String,
    val email: String
)

interface ApiService {

    @POST("api/auth/login")
    fun login(@Body request: LoginRequest): Call<User>

    @POST("api/auth/register")
    fun register(@Body request: RegisterRequest): Call<Void>
}