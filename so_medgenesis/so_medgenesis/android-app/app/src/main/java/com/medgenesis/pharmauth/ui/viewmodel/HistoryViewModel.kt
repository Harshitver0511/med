package com.medgenesis.pharmauth.ui.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.medgenesis.pharmauth.MedGenesisApp
import com.medgenesis.pharmauth.data.model.VerificationHistory
import kotlinx.coroutines.launch

class HistoryViewModel(
    private val repository: com.medgenesis.pharmauth.data.repository.VerificationRepository = MedGenesisApp.instance.repository
) : ViewModel() {
    
    var history by mutableStateOf<List<VerificationHistory>>(emptyList())
        private set
    
    var isLoading by mutableStateOf(false)
        private set
    
    fun loadHistory() {
        viewModelScope.launch {
            isLoading = true
            try {
                history = repository.getVerificationHistory()
            } catch (e: Exception) {
                // Handle error
                history = emptyList()
            } finally {
                isLoading = false
            }
        }
    }
    
    fun loadRecentHistory(limit: Int = 50) {
        viewModelScope.launch {
            isLoading = true
            try {
                history = repository.getRecentVerifications(limit)
            } catch (e: Exception) {
                // Handle error
                history = emptyList()
            } finally {
                isLoading = false
            }
        }
    }
    
    companion object {
        val Factory = viewModelFactory {
            initializer {
                HistoryViewModel()
            }
        }
    }
}