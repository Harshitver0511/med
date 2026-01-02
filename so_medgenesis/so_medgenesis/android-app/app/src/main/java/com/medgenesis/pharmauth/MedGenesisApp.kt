package com.medgenesis.pharmauth

import android.app.Application
import android.content.Context
import androidx.room.Room
import com.medgenesis.pharmauth.data.local.AppDatabase
import com.medgenesis.pharmauth.data.remote.ApiClient
import com.medgenesis.pharmauth.data.repository.VerificationRepository

class MedGenesisApp : Application() {
    
    companion object {
        lateinit var instance: MedGenesisApp
            private set
        
        fun getApplicationContext(): Context {
            return instance.applicationContext
        }
    }
    
    private lateinit var database: AppDatabase
    lateinit var repository: VerificationRepository
        private set
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Initialize database
        database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "medgenesis-db"
        ).build()
        
        // Initialize repository
        repository = VerificationRepository(
            apiService = ApiClient.apiService,
            database = database
        )
    }
}