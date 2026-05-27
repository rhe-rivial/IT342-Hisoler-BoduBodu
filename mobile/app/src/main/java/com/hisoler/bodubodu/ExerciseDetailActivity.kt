package com.hisoler.bodubodu

import android.os.Bundle
import android.widget.TextView

class ExerciseDetailActivity : BaseScreenActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_workout_detail)
        bindScreen()
        val exercise = WorkoutCache.exercise
        findViewById<TextView>(R.id.tvTitle).text = exercise?.name ?: "Exercise"
        findViewById<TextView>(R.id.tvSubtitle).text = exercise?.targetMuscleGroup ?: "Exercise video"
        clear()
        if (exercise == null) {
            empty("Exercise not found.")
            return
        }
        addVideo(exercise.video ?: exercise.image)
        card {
            bold(exercise.name, 20)
            small("${exercise.difficultyLevel ?: "Beginner"} - ${exercise.targetMuscleGroup ?: "Target muscle"}")
            body(exercise.description ?: "No description available.")
        }
    }
}
