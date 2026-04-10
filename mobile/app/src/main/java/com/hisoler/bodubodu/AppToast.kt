package com.hisoler.bodubodu

import android.app.Activity
import android.graphics.Color
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.cardview.widget.CardView

object AppToast {

    fun success(activity: Activity, message: String) {
        show(activity, message, "#1B5E20", "#E8F5E9", "#2E7D32")
    }

    fun error(activity: Activity, message: String) {
        show(activity, message, "#B71C1C", "#FFEBEE", "#C62828")
    }

    private fun show(
        activity: Activity,
        message: String,
        iconColor: String,
        bgColor: String,
        textColor: String
    ) {
        val inflater = LayoutInflater.from(activity)
        val layout = inflater.inflate(R.layout.toast_custom, null)

        val card = layout.findViewById<CardView>(R.id.toastCard)
        val tvMsg = layout.findViewById<TextView>(R.id.toastMessage)
        val dot = layout.findViewById<View>(R.id.toastDot)

        card.setCardBackgroundColor(Color.parseColor(bgColor))
        tvMsg.setTextColor(Color.parseColor(textColor))
        tvMsg.text = message
        dot.setBackgroundColor(Color.parseColor(iconColor))

        val toast = Toast(activity)
        toast.duration = Toast.LENGTH_LONG
        toast.view = layout
        toast.setGravity(Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL, 0, 160)
        toast.show()
    }
}