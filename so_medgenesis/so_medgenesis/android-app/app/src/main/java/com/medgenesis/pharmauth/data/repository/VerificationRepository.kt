package com.medgenesis.pharmauth.data.repository

import android.util.Log
import com.medgenesis.pharmauth.data.local.AppDatabase
import com.medgenesis.pharmauth.data.model.LocationData
import com.medgenesis.pharmauth.data.model.VerificationResult
import com.medgenesis.pharmauth.data.model.VerificationHistory
import com.medgenesis.pharmauth.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.Date

class VerificationRepository(
    private val apiService: ApiService,
    private val database: AppDatabase
) {
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    //  IMPORTANT: CHANGE THIS TO YOUR BACKEND URL
    // For Android Emulator: use "http://10.0.2.2:8080"
    // For Real Phone: use your computer's IP like "http://192.168.1.100:8080"
    // Make sure phone and computer are on the SAME WiFi network
    private val baseUrl = "http://10.0.2.2:8080" // Change this!
    
    /**
     * Verify authentication code with backend
     */
    suspend fun verifyCode(
        authCode: String,
        locationData: LocationData?
    ): VerificationResult = withContext(Dispatchers.IO) {
        try {
            Log.d("VerificationRepo", "=================================")
            Log.d("VerificationRepo", "Connecting to: $baseUrl/api/verify")
            Log.d("VerificationRepo", "Auth code: $authCode")
            Log.d("VerificationRepo", "Location: ${locationData?.latitude}, ${locationData?.longitude}")
            
            // Create JSON request body
            val jsonBody = JSONObject().apply {
                put("authenticationCode", authCode)
                locationData?.let {
                    put("latitude", it.latitude)
                    put("longitude", it.longitude)
                }
            }
            
            Log.d("VerificationRepo", "Request body: $jsonBody")
            
            // Build HTTP request
            val requestBody = jsonBody.toString()
                .toRequestBody("application/json".toMediaType())
            
            val request = Request.Builder()
                .url("$baseUrl/api/verify")
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .build()
            
            // Execute request
            Log.d("VerificationRepo", "Sending request...")
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            Log.d("VerificationRepo", "Response code: ${response.code}")
            Log.d("VerificationRepo", "Response body: $responseBody")
            Log.d("VerificationRepo", "=================================")
            
            // Check if request was successful
            if (!response.isSuccessful) {
                Log.e("VerificationRepo", "Server error: ${response.code}")
                val result = VerificationResult.Invalid(
                    reason = "Server error: ${response.code} - ${response.message}"
                )
                saveToHistory(authCode, result, locationData)
                return@withContext result
            }
            
            // Parse JSON response
            responseBody?.let { body ->
                val json = JSONObject(body)
                val status = json.optString("status", "unknown")
                
                val result = when (status.lowercase()) {
                    "authentic" -> {
                        VerificationResult.Authentic(
                            productName = json.optString("productName", "Unknown Product"),
                            manufacturerId = json.optString("manufacturerId", "Unknown"),
                            batchId = json.optString("batchId", "Unknown"),
                            confidence = json.optDouble("confidence", 0.95)
                        )
                    }
                    "suspicious" -> {
                        VerificationResult.Suspicious(
                            reason = json.optString("reason", "Product appears suspicious")
                        )
                    }
                    "invalid" -> {
                        VerificationResult.Invalid(
                            reason = json.optString("reason", "Invalid authentication code")
                        )
                    }
                    else -> {
                        VerificationResult.Unverified(
                            reason = json.optString("reason", "Could not verify product")
                        )
                    }
                }
                
                // Save to history
                saveToHistory(authCode, result, locationData)
                result
                
            } ?: run {
                Log.e("VerificationRepo", "Empty response body")
                val result = VerificationResult.Invalid(reason = "Empty response from server")
                saveToHistory(authCode, result, locationData)
                result
            }
            
        } catch (e: java.net.ConnectException) {
            Log.e("VerificationRepo", " Connection failed - Cannot reach server", e)
            val result = VerificationResult.Invalid(
                reason = "Cannot connect to server at $baseUrl. Check network and server."
            )
            saveToHistory(authCode, result, locationData)
            result
            
        } catch (e: java.net.SocketTimeoutException) {
            Log.e("VerificationRepo", " Timeout - Server not responding", e)
            val result = VerificationResult.Invalid(
                reason = "Connection timeout. Server at $baseUrl not responding."
            )
            saveToHistory(authCode, result, locationData)
            result
            
        } catch (e: java.net.UnknownHostException) {
            Log.e("VerificationRepo", " Unknown host - Check URL", e)
            val result = VerificationResult.Invalid(
                reason = "Cannot find server at $baseUrl. Check URL."
            )
            saveToHistory(authCode, result, locationData)
            result
            
        } catch (e: Exception) {
            Log.e("VerificationRepo", " Verification error", e)
            val result = VerificationResult.Invalid(
                reason = "Error: ${e.message}"
            )
            saveToHistory(authCode, result, locationData)
            result
        }
    }
    
    /**
     * Test backend connection
     */
    suspend fun testConnection(): Boolean = withContext(Dispatchers.IO) {
        try {
            Log.d("VerificationRepo", "Testing connection to: $baseUrl/health")
            
            val request = Request.Builder()
                .url("$baseUrl/health")
                .get()
                .build()
            
            val response = client.newCall(request).execute()
            val isSuccess = response.isSuccessful
            
            Log.d("VerificationRepo", "Health check result: $isSuccess (${response.code})")
            isSuccess
            
        } catch (e: Exception) {
            Log.e("VerificationRepo", "Health check failed", e)
            false
        }
    }
    
    /**
     * Save verification to history
     */
    private suspend fun saveToHistory(
        authCode: String,
        result: VerificationResult,
        locationData: LocationData?
    ) {
        val history = when (result) {
            is VerificationResult.Authentic -> VerificationHistory(
                authenticationCode = authCode,
                result = "authentic",
                productName = result.productName,
                manufacturerId = result.manufacturerId,
                batchId = result.batchId,
                confidence = result.confidence,
                locationLat = locationData?.latitude,
                locationLng = locationData?.longitude,
                timestamp = Date()
            )
            is VerificationResult.Suspicious -> VerificationHistory(
                authenticationCode = authCode,
                result = "suspicious",
                productName = "Suspicious Product",
                locationLat = locationData?.latitude,
                locationLng = locationData?.longitude,
                timestamp = Date()
            )
            is VerificationResult.Invalid -> VerificationHistory(
                authenticationCode = authCode,
                result = "invalid",
                productName = null,
                locationLat = locationData?.latitude,
                locationLng = locationData?.longitude,
                timestamp = Date()
            )
            is VerificationResult.Unverified -> VerificationHistory(
                authenticationCode = authCode,
                result = "unverified",
                productName = "Unverified Product",
                locationLat = locationData?.latitude,
                locationLng = locationData?.longitude,
                timestamp = Date()
            )
        }
        
        database.verificationHistoryDao().insert(history)
        Log.d("VerificationRepo", "Saved to Room: ${history.result}")
    }
    
    /**
     * Get recent verifications
     */
    suspend fun getRecentVerifications(limit: Int): List<VerificationHistory> {
        return database.verificationHistoryDao().getRecent(limit)
    }
    
    /**
     * Get all verification history
     */
    suspend fun getVerificationHistory(): List<VerificationHistory> {
        return database.verificationHistoryDao().getAll()
    }
    
    /**
     * Sync offline data (placeholder for future implementation)
     */
    suspend fun syncOfflineData(apiKey: String) {
        // TODO: Implement sync logic for offline data
        Log.d("VerificationRepo", "Syncing offline data...")
    }
    
    /**
     * Clear all history
     */
    suspend fun clearHistory() {
        database.verificationHistoryDao().deleteAll()
        Log.d("VerificationRepo", "History cleared from Room")
    }
}