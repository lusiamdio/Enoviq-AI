package com.enoviq.ai.scanning.menu

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.enoviq.ai.scanning.vision.VisionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class MenuScanState {
    object Idle : MenuScanState()
    object Processing : MenuScanState()
    data class Success(val result: MenuScanResult) : MenuScanState()
    data class Error(val message: String) : MenuScanState()
}

class MenuScanViewModel(
    private val repository: VisionRepository = VisionRepository()
) : ViewModel() {

    private val _scanState = MutableStateFlow<MenuScanState>(MenuScanState.Idle)
    val scanState: StateFlow<MenuScanState> = _scanState.asStateFlow()

    fun scanMenu(bitmap: Bitmap) {
        _scanState.value = MenuScanState.Processing
        viewModelScope.launch {
            try {
                val extractedText = repository.extractTextFromBitmap(bitmap)
                if (extractedText == null) {
                    _scanState.value = MenuScanState.Error("Failed to extract text from menu image.")
                    return@launch
                }

                val scanResult = MenuParser.parseFromOcr(extractedText)
                _scanState.value = MenuScanState.Success(scanResult)
            } catch (e: Exception) {
                _scanState.value = MenuScanState.Error(e.message ?: "An unexpected error occurred scanning the menu.")
            }
        }
    }

    fun resetScanner() {
        _scanState.value = MenuScanState.Idle
    }
}
