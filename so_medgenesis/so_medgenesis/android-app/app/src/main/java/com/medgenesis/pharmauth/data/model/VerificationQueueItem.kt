package com.medgenesis.pharmauth.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "verification_queue")
data class VerificationQueueItem(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val authenticationCode: String,
    val timestamp: Date,
    val locationLat: Double?,
    val locationLng: Double?,
    val synced: Boolean = false
)