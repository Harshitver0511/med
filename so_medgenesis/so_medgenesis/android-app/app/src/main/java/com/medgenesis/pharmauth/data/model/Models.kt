package com.medgenesis.pharmauth.data.model

import com.google.gson.annotations.SerializedName

// API Request/Response Models
data class VerificationRequest(
    @SerializedName("authentication_code")
    val authenticationCode: String,
    @SerializedName("location")
    val location: LocationData?
)

data class VerificationResponse(
    @SerializedName("status")
    val status: String,
    @SerializedName("confidence")
    val confidence: Float,
    @SerializedName("manufacturer_id")
    val manufacturerId: String?,
    @SerializedName("batch_id")
    val batchId: String?,
    @SerializedName("product_name")
    val productName: String?,
    @SerializedName("timestamp")
    val timestamp: String
)

// UI State Models
sealed class UiState {
    object Idle : UiState()
    object Loading : UiState()
    data class Success(val result: VerificationResult) : UiState()
    data class Error(val message: String) : UiState()
}

data class ScanResult(
    val code: String,
    val timestamp: java.util.Date = java.util.Date(),
    val location: LocationData? = null
)