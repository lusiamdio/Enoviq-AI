package com.enoviq.ai.scanning.vision

import kotlinx.serialization.Serializable

@Serializable
data class VisionRequest(
    val requests: List<AnnotateImageRequest>
)

@Serializable
data class AnnotateImageRequest(
    val image: ImageSource,
    val features: List<Feature>
)

@Serializable
data class ImageSource(
    val content: String // Base64 encoded image
)

@Serializable
data class Feature(
    val type: String = "TEXT_DETECTION",
    val maxResults: Int = 1
)

@Serializable
data class VisionResponse(
    val responses: List<AnnotateImageResponse>
)

@Serializable
data class AnnotateImageResponse(
    val textAnnotations: List<TextAnnotation>? = null,
    val fullTextAnnotation: FullTextAnnotation? = null
)

@Serializable
data class TextAnnotation(
    val locale: String? = null,
    val description: String,
    val boundingPoly: BoundingPoly? = null
)

@Serializable
data class FullTextAnnotation(
    val text: String
)

@Serializable
data class BoundingPoly(
    val vertices: List<Vertex>
)

@Serializable
data class Vertex(
    val x: Int? = null,
    val y: Int? = null
)
