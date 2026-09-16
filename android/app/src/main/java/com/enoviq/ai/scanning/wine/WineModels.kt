package com.enoviq.ai.scanning.wine

import kotlinx.serialization.Serializable

@Serializable
data class GrapeRatio(
    val name: String,
    val percent: Int
)

@Serializable
data class WineDetails(
    val name: String,
    val vintage: String = "N/V",
    val classification: String = "",
    val region: String = "",
    val country: String = "",
    val grape: String = "",
    val notes: String = "",
    val price: String = "",
    val rating: Int = 90,
    val abv: String = "13.5%",
    val isOrganic: Boolean = false,
    val caloriesPerGlass: Int = 120,
    val match: String = "90%",
    val recommendationReason: String = "",
    val confidence: Double = 0.90,
    val decant: String = "30 minutes",
    val drinkWindow: String = "2024 - 2030",
    val temperature: String = "16-18°C",
    val pairings: List<String> = emptyList(),
    val grapesRatio: List<GrapeRatio> = emptyList(),
    val imageUrl: String = ""
)
