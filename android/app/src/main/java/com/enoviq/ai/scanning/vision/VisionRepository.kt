package com.enoviq.ai.scanning.vision

import android.graphics.Bitmap
import com.enoviq.ai.scanning.common.ImageUtils

class VisionRepository(private val apiService: VisionApiService = VisionApiService()) {

    /**
     * Extracts text from a bitmap image by preprocessing it first.
     */
    suspend fun extractTextFromBitmap(bitmap: Bitmap): String? {
        val processedBitmap = ImageUtils.preprocessForOcr(bitmap, increaseContrast = true)
        val base64 = ImageUtils.bitmapToBase64(processedBitmap)
        return apiService.performOcr(base64)
    }

    /**
     * Extracts text directly from base64 representation.
     */
    suspend fun extractTextFromBase64(base64: String): String? {
        return apiService.performOcr(base64)
    }
}
