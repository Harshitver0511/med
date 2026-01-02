package com.medgenesis.pharmauth.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "verification_history")
data class VerificationHistory(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val authenticationCode: String,
    val result: String,
    val productName: String?,
    val manufacturerId: String? = null,
    val batchId: String? = null,
    val confidence: Double? = null,
    val locationLat: Double? = null,
    val locationLng: Double? = null,
    val timestamp: Date = Date(),
    val synced: Boolean = false
)