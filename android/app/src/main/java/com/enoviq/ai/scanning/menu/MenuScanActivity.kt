package com.enoviq.ai.scanning.menu

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels

class MenuScanActivity : ComponentActivity() {

    private val viewModel: MenuScanViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MenuScanScreen(
                viewModel = viewModel,
                onBack = { finish() }
            )
        }
    }
}
