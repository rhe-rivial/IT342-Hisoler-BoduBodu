package com.hisoler.bodubodu

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.view.View
import kotlin.math.min

class TimerRingView(context: Context) : View(context) {
    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFE2D1")
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#E65100")
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#212121")
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#757575")
        textAlign = Paint.Align.CENTER
    }
    private val textBounds = Rect()

    private var totalSeconds = 1
    private var remainingSeconds = 1
    private var label = "seconds left"

    fun setTimer(total: Int, remaining: Int, label: String) {
        totalSeconds = total.coerceAtLeast(1)
        remainingSeconds = remaining.coerceIn(0, totalSeconds)
        this.label = label
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val size = min(width, height).toFloat()
        val stroke = size * 0.08f
        val radius = (size - stroke) / 2f
        val cx = width / 2f
        val cy = height / 2f

        trackPaint.strokeWidth = stroke
        progressPaint.strokeWidth = stroke
        canvas.drawCircle(cx, cy, radius, trackPaint)

        val sweep = 360f * (remainingSeconds.toFloat() / totalSeconds.toFloat())
        canvas.drawArc(cx - radius, cy - radius, cx + radius, cy + radius, -90f, sweep, false, progressPaint)

        val timeText = "%02d:%02d".format(remainingSeconds / 60, remainingSeconds % 60)
        textPaint.textSize = size * 0.22f
        labelPaint.textSize = size * 0.075f
        textPaint.getTextBounds(timeText, 0, timeText.length, textBounds)
        canvas.drawText(timeText, cx, cy + textBounds.height() / 2f, textPaint)
        canvas.drawText(label, cx, cy + textBounds.height() + size * 0.08f, labelPaint)
    }
}
