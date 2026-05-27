package com.hisoler.bodubodu.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String
)

data class GoogleAuthRequest(
    val credential: String
)

data class ForgotPasswordRequest(
    val email: String
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
    val email: String,
    val role: String? = null,
    val createdAt: String? = null
)

data class UpdateUserRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val currentPassword: String? = null,
    val newPassword: String? = null
)

data class DashboardStats(
    val totalWorkouts: Int = 0,
    val workoutsThisWeek: Int = 0,
    val totalMinutes: Int = 0,
    val totalExercises: Int = 0,
    val currentStreak: Int = 0,
    val longestStreak: Int = 0
)

data class Exercise(
    val exerciseId: Long? = null,
    val id: Long? = null,
    val name: String = "",
    val description: String? = null,
    val difficultyLevel: String? = null,
    val targetMuscleGroup: String? = null,
    val video: String? = null,
    val image: String? = null
)

data class WorkoutExercise(
    val exerciseId: Long? = null,
    val exerciseName: String? = null,
    val name: String? = null,
    val sets: Int = 3,
    val repetitions: Int = 10,
    val restInterval: Int = 30,
    val exerciseOrder: Int? = null
)

data class DefaultWorkout(
    val defaultWorkoutId: Long? = null,
    val name: String = "",
    val description: String? = null,
    val difficultyLevel: String? = null,
    val exercises: List<WorkoutExercise> = emptyList()
)

data class CustomWorkout(
    val customWorkoutId: Long? = null,
    val id: Long? = null,
    val name: String = "",
    val createdAt: String? = null,
    val exercises: List<WorkoutExercise> = emptyList()
)

data class CreateWorkoutExercise(
    val exerciseId: Long,
    val sets: Int,
    val repetitions: Int,
    val restInterval: Int,
    val exerciseOrder: Int
)

data class CreateCustomWorkoutRequest(
    val name: String,
    val exercises: List<CreateWorkoutExercise>
)

data class WorkoutSession(
    val id: Long? = null,
    val workoutName: String? = null,
    val name: String? = null,
    val workoutType: String? = null,
    val type: String? = null,
    val defaultWorkoutId: Long? = null,
    val customWorkoutId: Long? = null,
    val duration: Int? = null,
    val exercises: Int? = null,
    val completedAt: String? = null
)

data class LogWorkoutRequest(
    val workoutName: String,
    val duration: Int,
    val exercises: Int,
    val defaultWorkoutId: Long?,
    val customWorkoutId: Long?,
    val completedAt: String
)

data class ApiMessage(
    val id: Long? = null,
    val message: String? = null
)

interface ApiService {

    @POST("api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    @POST("api/auth/register")
    fun register(@Body request: RegisterRequest): Call<Void>

    @POST("api/auth/google")
    fun googleAuth(@Body request: GoogleAuthRequest): Call<LoginResponse>

    @POST("api/auth/forgot-password")
    fun forgotPassword(@Body request: ForgotPasswordRequest): Call<ApiMessage>

    @GET("api/user/me")
    fun me(@Header("Authorization") authorization: String): Call<User>

    @PUT("api/user/me")
    fun updateMe(
        @Header("Authorization") authorization: String,
        @Body request: UpdateUserRequest
    ): Call<User>

    @GET("api/dashboard/stats")
    fun dashboardStats(@Header("Authorization") authorization: String): Call<DashboardStats>

    @GET("api/dashboard/recent-workouts")
    fun recentWorkouts(
        @Header("Authorization") authorization: String,
        @Query("limit") limit: Int = 5
    ): Call<List<WorkoutSession>>

    @POST("api/dashboard/log-workout")
    fun logWorkout(
        @Header("Authorization") authorization: String,
        @Body request: LogWorkoutRequest
    ): Call<ApiMessage>

    @GET("api/v1/exercises")
    fun exercises(): Call<List<Exercise>>

    @GET("api/v1/default-workouts")
    fun defaultWorkouts(@Header("Authorization") authorization: String): Call<List<DefaultWorkout>>

    @GET("api/user/custom-workouts")
    fun customWorkouts(@Header("Authorization") authorization: String): Call<List<CustomWorkout>>

    @POST("api/user/custom-workouts")
    fun createCustomWorkout(
        @Header("Authorization") authorization: String,
        @Body request: CreateCustomWorkoutRequest
    ): Call<CustomWorkout>

    @PUT("api/user/custom-workouts/{id}")
    fun updateCustomWorkout(
        @Header("Authorization") authorization: String,
        @Path("id") id: Long,
        @Body request: CreateCustomWorkoutRequest
    ): Call<CustomWorkout>

    @DELETE("api/user/custom-workouts/{id}")
    fun deleteCustomWorkout(
        @Header("Authorization") authorization: String,
        @Path("id") id: Long
    ): Call<Void>

    @GET("api/workout-history")
    fun workoutHistory(@Header("Authorization") authorization: String): Call<List<WorkoutSession>>
}
