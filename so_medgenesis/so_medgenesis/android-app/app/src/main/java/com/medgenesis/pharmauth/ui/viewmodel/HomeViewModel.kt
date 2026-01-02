package com.medgenesis.pharmauth.ui.viewmodel

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.medgenesis.pharmauth.MedGenesisApp
import com.medgenesis.pharmauth.data.model.VerificationHistory
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class Stats(
    val totalScans: Int = 0,
    val authenticScans: Int = 0,
    val suspiciousScans: Int = 0,
    val offlineScans: Int = 0,
    val authenticPercentage: Int = 0,
    val recentVerifications: List<RecentVerification> = emptyList()
)

data class RecentVerification(
    val productName: String,
    val result: String,
    val timestamp: String
)

class HomeViewModel(
    private val repository: com.medgenesis.pharmauth.data.repository.VerificationRepository = MedGenesisApp.instance.repository
) : ViewModel() {
    
    var stats by mutableStateOf(Stats())
        private set
    
    fun loadStats() {
        viewModelScope.launch {
            try {
                val history = repository.getRecentVerifications(100)
                calculateStats(history)
            } catch (e: Exception) {
                // Handle error
                stats = Stats()
            }
        }
    }
    
    private fun calculateStats(history: List<VerificationHistory>) {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val todayHistory = history.filter { item ->
            val itemDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(item.timestamp)
            itemDate == today
        }
        
        val totalScans = todayHistory.size
        val authenticScans = todayHistory.count { it.result == "authentic" }
        val suspiciousScans = todayHistory.count { it.result == "suspicious" }
        val offlineScans = todayHistory.count { it.result == "unverified" }
        
        val authenticPercentage = if (totalScans > 0) {
            (authenticScans.toFloat() / totalScans * 100).toInt()
        } else 0
        
        val recentVerifications = history.take(10).map { item ->
            RecentVerification(
                productName = item.productName ?: "Unknown Product",
                result = item.result.uppercase(),
                timestamp = formatTimestamp(item.timestamp)
            )
        }
        
        stats = Stats(
            totalScans = totalScans,
            authenticScans = authenticScans,
            suspiciousScans = suspiciousScans,
            offlineScans = offlineScans,
            authenticPercentage = authenticPercentage,
            recentVerifications = recentVerifications
        )
    }
    
    private fun formatTimestamp(date: Date): String {
        val formatter = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
        return formatter.format(date)
    }
    
    companion object {
        val Factory = viewModelFactory {
            initializer {
                HomeViewModel()
            }
        }
    }
}