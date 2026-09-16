package com.enoviq.ai.scanning.common

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.util.Base64
import java.io.ByteArrayOutputStream

object ImageUtils {

    /**
     * Preprocesses a bitmap to increase OCR precision.
     * Converts to grayscale, increases contrast, and optionally applies soft binarization.
     */
    fun preprocessForOcr(src: Bitmap, increaseContrast: Boolean = true): Bitmap {
        val width = src.width
        val height = src.height
        val output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint()

        val grayscaleMatrix = ColorMatrix().apply {
            setSaturation(0f)
        }

        if (increaseContrast) {
            // Increase contrast by 1.4x (matching Web binarization engine)
            val contrast = 1.4f
            val translate = -128f * contrast + 128f
            val contrastMatrix = ColorMatrix(floatArrayOf(
                contrast, 0f, 0f, 0f, translate,
                0f, contrast, 0f, 0f, translate,
                0f, 0f, contrast, 0f, translate,
                0f, 0f, 0f, 1f, 0f
            ))
            grayscaleMatrix.postConcat(contrastMatrix)
        }

        paint.colorFilter = ColorMatrixColorFilter(grayscaleMatrix)
        canvas.drawBitmap(src, 0f, 0f, paint)
        return output
    }

    /**
     * Converts Bitmap to a Base64-encoded JPEG string.
     */
    fun bitmapToBase64(bitmap: Bitmap, quality: Int = 85): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }
}
