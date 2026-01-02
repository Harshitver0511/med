package com.medgenesis.pharmauth.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "cached_codes")
data class CachedCode(
    @PrimaryKey
    val authenticationCode: String,
    val manufacturerId: String,
    val batchId: String,
    val lastUpdated: Date
)