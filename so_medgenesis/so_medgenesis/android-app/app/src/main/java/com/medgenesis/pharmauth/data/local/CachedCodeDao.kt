package com.medgenesis.pharmauth.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.medgenesis.pharmauth.data.model.CachedCode

@Dao
interface CachedCodeDao {
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(cachedCode: CachedCode)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(cachedCodes: List<CachedCode>)
    
    @Query("SELECT * FROM cached_codes WHERE authenticationCode = :code")
    suspend fun getByCode(code: String): CachedCode?
    
    @Query("SELECT * FROM cached_codes")
    suspend fun getAll(): List<CachedCode>
    
    @Query("DELETE FROM cached_codes WHERE authenticationCode = :code")
    suspend fun delete(code: String)
    
    @Query("DELETE FROM cached_codes")
    suspend fun deleteAll()
    
    @Query("SELECT COUNT(*) FROM cached_codes")
    suspend fun count(): Int
}