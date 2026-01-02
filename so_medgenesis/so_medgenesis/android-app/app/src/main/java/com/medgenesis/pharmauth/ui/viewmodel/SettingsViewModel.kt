package com.medgenesis.pharmauth.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.medgenesis.pharmauth.MedGenesisApp
import kotlinx.coroutines.launch

data class AppSettings(
    val apiKey: String = "demo-api-key",
    val serverUrl: String = "http://localhost:8080",
    val autoSync: Boolean = true,
    val wifiOnlySync: Boolean = false,
    val includeLocation: Boolean = true,
    val preciseLocation: Boolean = false,
    val databaseSize: Double = 0.0,
    val cachedCodes: Int = 0,
    val offlineQueue: Int = 0
)

sealed class SyncStatus {
    object Idle : SyncStatus()
    object Syncing : SyncStatus()
    data class Success(val count: Int) : SyncStatus()
    data class Error(val message: String) : SyncStatus()
}

class SettingsViewModel(
    private val repository: com.medgenesis.pharmauth.data.repository.VerificationRepository = MedGenesisApp.instance.repository
) : ViewModel() {
    
    var settings by mutableStateOf(AppSettings())
        private set
    
    var syncStatus by mutableStateOf<SyncStatus>(SyncStatus.Idle)
        private set
    
    fun loadSettings() {
        viewModelScope.launch {
            try {
                val history = repository.getRecentVerifications(1)
                val cachedCodes = history.size
                val offlineQueue = 0
                
                settings = settings.copy(
                    cachedCodes = cachedCodes,
                    offlineQueue = offlineQueue
                )
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    fun updateAutoSync(enabled: Boolean) {
        settings = settings.copy(autoSync = enabled)
    }
    
    fun updateWifiOnlySync(enabled: Boolean) {
        settings = settings.copy(wifiOnlySync = enabled)
    }
    
    fun updateIncludeLocation(enabled: Boolean) {
        settings = settings.copy(includeLocation = enabled)
    }
    
    fun updatePreciseLocation(enabled: Boolean) {
        settings = settings.copy(preciseLocation = enabled)
    }
    
    fun syncNow() {
        viewModelScope.launch {
            syncStatus = SyncStatus.Syncing
            try {
                repository.syncOfflineData(settings.apiKey)
                syncStatus = SyncStatus.Success(0)
                loadSettings()
            } catch (e: Exception) {
                syncStatus = SyncStatus.Error(e.message ?: "Sync failed")
            }
        }
    }
    
    companion object {
        val Factory = viewModelFactory {
            initializer {
                SettingsViewModel()
            }
        }
    }
}