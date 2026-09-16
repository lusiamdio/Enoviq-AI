package com.enoviq.ai.scanning.vision

import android.util.Log
import com.enoviq.ai.scanning.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

class VisionApiService {

    private val client = OkHttpClient()
    private val json = Json { ignoreUnknownKeys = true }
    private val mediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun performOcr(base64Image: String): String? = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.CLOUD_VISION_API_KEY
        if (apiKey.isEmpty()) {
            Log.e(TAG, "CLOUD_VISION_API_KEY is not configured! Please set it in build.gradle.")
            return@withContext null
        }

        val requestUrl = "https://vision.googleapis.com/v1/images:annotate?key=$apiKey"

        val requestObj = VisionRequest(
            requests = listOf(
                AnnotateImageRequest(
                    image = ImageSource(content = base64Image),
                    features = listOf(Feature(type = "TEXT_DETECTION"))
                )
            )
        )

        val requestBodyJson = json.encodeToString(VisionRequest.serializer(), requestObj)
        val requestBody = requestBodyJson.toRequestBody(mediaType)

        val request = Request.Builder()
            .url(requestUrl)
            .post(requestBody)
            .build()

        try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "Vision API error: Code ${response.code}, Body: ${response.body?.string()}")
                    return@withContext null
                }

                val responseBody = response.body?.string() ?: return@withContext null
                val visionResponse = json.decodeFromString(VisionResponse.serializer(), responseBody)
                
                // Return full annotation text
                val fullText = visionResponse.responses.firstOrNull()?.fullTextAnnotation?.text
                val firstAnnotation = visionResponse.responses.firstOrNull()?.textAnnotations?.firstOrNull()?.description
                
                return@withContext fullText ?: firstAnnotation
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network call failed", e)
            return@withContext null
        }
    }

    companion object {
        private const val TAG = "VisionApiService"
    }
}
