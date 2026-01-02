package com.medgenesis.pharmauth.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.medgenesis.pharmauth.data.model.VerificationQueueItem

@Dao
interface VerificationQueueDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: VerificationQueueItem)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<VerificationQueueItem>)
    
    @Query("SELECT * FROM verification_queue WHERE synced = 0 ORDER BY timestamp ASC")
    suspend fun getUnsynced(): List<VerificationQueueItem>
    
    @Query("SELECT * FROM verification_queue WHERE id = :id")
    suspend fun getById(id: Long): VerificationQueueItem?
    
    @Update
    suspend fun update(item: VerificationQueueItem)
    
    @Query("UPDATE verification_queue SET synced = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)
    
    @Query("DELETE FROM verification_queue WHERE synced = 1")
    suspend fun deleteSynced()
    
    @Query("SELECT COUNT(*) FROM verification_queue WHERE synced = 0")
    suspend fun countUnsynced(): Int
}