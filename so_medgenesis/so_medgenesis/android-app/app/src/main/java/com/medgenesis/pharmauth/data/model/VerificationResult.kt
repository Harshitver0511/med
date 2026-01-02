package com.medgenesis.pharmauth.data.model

sealed class VerificationResult {
    data class Authentic(
        val productName: String,
        val manufacturerId: String,
        val batchId: String,
        val confidence: Double
    ) : VerificationResult()
    
    data class Suspicious(
        val reason: String
    ) : VerificationResult()
    
    data class Invalid(
        val reason: String
    ) : VerificationResult()
    
    data class Unverified(
        val reason: String
    ) : VerificationResult()
}