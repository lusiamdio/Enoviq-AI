package com.enoviq.ai.scanning.wine

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.enoviq.ai.scanning.vision.VisionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class WineScanState {
    object Idle : WineScanState()
    object Processing : WineScanState()
    data class Success(val wineDetails: WineDetails) : WineScanState()
    data class Error(val message: String) : WineScanState()
}

class WineScanViewModel(
    private val repository: VisionRepository = VisionRepository()
) : ViewModel() {

    private val _scanState = MutableStateFlow<WineScanState>(WineScanState.Idle)
    val scanState: StateFlow<WineScanState> = _scanState.asStateFlow()

    private val _scannedHistory = MutableStateFlow<List<WineDetails>>(emptyList())
    val scannedHistory: StateFlow<List<WineDetails>> = _scannedHistory.asStateFlow()

    private val _isEditing = MutableStateFlow(false)
    val isEditing: StateFlow<Boolean> = _isEditing.asStateFlow()

    private val _editingWine = MutableStateFlow<WineDetails?>(null)
    val editingWine: StateFlow<WineDetails?> = _editingWine.asStateFlow()

    fun scanImage(bitmap: Bitmap) {
        _scanState.value = WineScanState.Processing
        viewModelScope.launch {
            try {
                val extractedText = repository.extractTextFromBitmap(bitmap)
                if (extractedText == null) {
                    _scanState.value = WineScanState.Error("OCR parsing returned empty or failed. Please check internet connection.")
                    return@launch
                }

                val wineDetails = WineLabelParser.parseFromOcr(extractedText)
                _scanState.value = WineScanState.Success(wineDetails)

                // Cache to scan history
                _scannedHistory.value = _scannedHistory.value + wineDetails

                // Low confidence check - trigger manual editing flow automatically if < 85%
                if (wineDetails.confidence < 0.85) {
                    _editingWine.value = wineDetails
                    _isEditing.value = true
                }
            } catch (e: Exception) {
                _scanState.value = WineScanState.Error(e.message ?: "An unexpected scanner error occurred.")
            }
        }
    }

    fun startEditing(wine: WineDetails) {
        _editingWine.value = wine
        _isEditing.value = true
    }

    fun finishEditing(updatedWine: WineDetails) {
        _editingWine.value = null
        _isEditing.value = false
        _scanState.value = WineScanState.Success(updatedWine)
        
        // Update item in history
        _scannedHistory.value = _scannedHistory.value.map {
            if (it.name == updatedWine.name) updatedWine else it
        }
    }

    fun dismissEditing() {
        _editingWine.value = null
        _isEditing.value = false
    }

    fun resetScanner() {
        _scanState.value = WineScanState.Idle
    }
}
