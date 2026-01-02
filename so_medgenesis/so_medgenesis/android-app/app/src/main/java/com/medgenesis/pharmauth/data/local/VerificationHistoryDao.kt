package com.medgenesis.pharmauth.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.medgenesis.pharmauth.data.model.VerificationHistory

@Dao
interface VerificationHistoryDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(history: VerificationHistory)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(historyList: List<VerificationHistory>)
    
    @Query("SELECT * FROM verification_history ORDER BY timestamp DESC")
    suspend fun getAll(): List<VerificationHistory>
    
    @Query("SELECT * FROM verification_history ORDER BY timestamp DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<VerificationHistory>
    
    @Query("SELECT * FROM verification_history WHERE result = :result ORDER BY timestamp DESC")
    suspend fun getByResult(result: String): List<VerificationHistory>
    
    @Query("SELECT COUNT(*) FROM verification_history")
    suspend fun count(): Int
    
    @Query("DELETE FROM verification_history WHERE timestamp < :beforeDate")
    suspend fun deleteOldRecords(beforeDate: Long)

    @Query("DELETE FROM verification_history")
    suspend fun deleteAll()
}