package com.medgenesis.pharmauth.data.remote

import com.medgenesis.pharmauth.data.model.VerificationRequest
import com.medgenesis.pharmauth.data.model.VerificationResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {
    
    @POST("/api/verify")
    suspend fun verifyCode(
        @Header("X-API-Key") apiKey: String,
        @Body request: VerificationRequest
    ): Response<VerificationResponse>
    
    @POST("/api/sync")
    suspend fun syncOfflineVerifications(
        @Header("X-API-Key") apiKey: String,
        @Body verifications: List<VerificationRequest>
    ): Response<Any>
}