package com.enoviq.ai.scanning.menu

import kotlinx.serialization.Serializable

@Serializable
data class Dish(
    val name: String,
    val category: String,
    val pairingNotes: String
)

@Serializable
data class MenuPairing(
    val wine: String,
    val match: Int,
    val style: String,
    val bestFor: String,
    val reason: String
)

@Serializable
data class MenuScanResult(
    val type: String = "menu",
    val dishes: List<Dish> = emptyList(),
    val pairings: List<MenuPairing> = emptyList()
)
