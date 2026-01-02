package com.medgenesis.pharmauth.ui.viewmodel

import android.app.Application
import android.location.Location
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.google.android.gms.location.LocationServices
import com.medgenesis.pharmauth.MedGenesisApp
import com.medgenesis.pharmauth.data.model.LocationData
import com.medgenesis.pharmauth.data.repository.VerificationRepository
import kotlinx.coroutines.launch

class ScanViewModel(
    application: Application,
    private val repository: VerificationRepository = MedGenesisApp.instance.repository
) : AndroidViewModel(application) {
    
    sealed class UiState {
        object Idle : UiState()
        object Loading : UiState()
        data class Success(val result: com.medgenesis.pharmauth.data.model.VerificationResult) : UiState()
        data class Error(val message: String) : UiState()
        object PermissionDenied : UiState()
    }
    
    var uiState by mutableStateOf<UiState>(UiState.Idle)
        private set
    
    private val fusedLocationClient by lazy {
        LocationServices.getFusedLocationProviderClient(application)
    }
    
    // This is the NEW method that gets called when QR code is scanned
    fun verifyScannedCode(qrCode: String) {
        Log.d("ScanViewModel", "QR Code scanned: $qrCode")
        uiState = UiState.Loading
        
        viewModelScope.launch {
            try {
                // Get current location
                getCurrentLocation { location ->
                    viewModelScope.launch {
                        performVerification(qrCode, location)
                    }
                }
            } catch (e: Exception) {
                Log.e("ScanViewModel", "Verification error", e)
                uiState = UiState.Error("Failed to verify: ${e.message}")
            }
        }
    }
    
    private suspend fun performVerification(authCode: String, location: Location?) {
        try {
            Log.d("ScanViewModel", "Verifying code: $authCode")
            
            val locationData = location?.let {
                LocationData(it.latitude, it.longitude)
            }
            
            // This calls your backend API
            val result = repository.verifyCode(authCode, locationData)
            
            Log.d("ScanViewModel", "Verification result: $result")
            uiState = UiState.Success(result)
            
        } catch (e: Exception) {
            Log.e("ScanViewModel", "Verification failed", e)
            uiState = UiState.Error("Verification failed: ${e.message}")
        }
    }
    
    fun resetState() {
        uiState = UiState.Idle
    }
    
    fun onPermissionGranted() {
        if (uiState is UiState.PermissionDenied) {
            uiState = UiState.Idle
        }
    }
    
    fun onPermissionDenied() {
        uiState = UiState.PermissionDenied
    }
    
    private fun getCurrentLocation(callback: (Location?) -> Unit) {
        try {
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location: Location? ->
                    Log.d("ScanViewModel", "Location: ${location?.latitude}, ${location?.longitude}")
                    callback(location)
                }
                .addOnFailureListener { e ->
                    Log.e("ScanViewModel", "Failed to get location", e)
                    callback(null)
                }
        } catch (e: SecurityException) {
            Log.e("ScanViewModel", "Location permission denied", e)
            callback(null)
        }
    }
    
    companion object {
        val Factory = viewModelFactory {
            initializer {
                val application = this[androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.APPLICATION_KEY] as Application
                ScanViewModel(application)
            }
        }
    }
}