package com.medgenesis.pharmauth.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.medgenesis.pharmauth.data.model.CachedCode
import com.medgenesis.pharmauth.data.model.VerificationHistory
import com.medgenesis.pharmauth.data.model.VerificationQueueItem

@Database(
    entities = [
        CachedCode::class,
        VerificationQueueItem::class,
        VerificationHistory::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun cachedCodeDao(): CachedCodeDao
    abstract fun verificationQueueDao(): VerificationQueueDao
    abstract fun verificationHistoryDao(): VerificationHistoryDao
}