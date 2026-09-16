package com.enoviq.ai.scanning.wine

object PairingEngine {

    fun getPairingsForGrape(grape: String): List<String> {
        return when (grape.lowercase()) {
            "pinotage" -> listOf("Spiced Venison", "Barbecue Ribs", "South African Braai", "Hard Aged Cheddar")
            "cabernet sauvignon" -> listOf("Prime Ribeye Steak", "Grilled Rosemary Lamb Chops", "Portobello Mushrooms")
            "merlot" -> listOf("Pan-Seared Duck Breast", "Roasted Pork Loin", "Tomato-based Pasta")
            "chardonnay" -> listOf("Buttery Lobster Tails", "Pan-Seared Salmon", "Creamy Mushroom Risotto")
            "sauvignon blanc" -> listOf("Fresh Goat Cheese", "Grilled Halibut with Herbs", "Oysters on the half shell")
            "syrah", "shiraz" -> listOf("Smoked Beef Brisket", "Slow-cooked Game Casserole", "Dark Chocolate Tart")
            else -> listOf("Aged Artisanal Cheeses", "Charcuterie Selections", "Seasonal Tapas")
        }
    }
}
