package com.hisoler.bodubodu

import com.hisoler.bodubodu.network.DefaultWorkout
import com.hisoler.bodubodu.network.Exercise
import com.hisoler.bodubodu.network.CustomWorkout

object WorkoutCache {
    var defaultWorkout: DefaultWorkout? = null
    var customWorkout: CustomWorkout? = null
    var exercise: Exercise? = null
}
