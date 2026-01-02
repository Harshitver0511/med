package com.medgenesis.pharmauth.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.medgenesis.pharmauth.ui.components.BottomNavigationBar
import com.medgenesis.pharmauth.ui.viewmodel.SettingsViewModel
import com.medgenesis.pharmauth.ui.viewmodel.SyncStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: SettingsViewModel = viewModel(factory = SettingsViewModel.Factory)
) {
    val settings = viewModel.settings
    val syncStatus = viewModel.syncStatus
    
    LaunchedEffect(Unit) {
        viewModel.loadSettings()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            BottomNavigationBar(navController)
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // API Settings
            Text(
                text = "API Configuration",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SettingsItem(
                        title = "API Key",
                        description = settings.apiKey,
                        onClick = { /* Show API key dialog */ }
                    )
                    SettingsItem(
                        title = "Server URL",
                        description = settings.serverUrl,
                        onClick = { /* Show server URL dialog */ }
                    )
                }
            }
            
            // Sync Settings
            Text(
                text = "Data Synchronization",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SettingsToggle(
                        title = "Auto Sync",
                        description = "Automatically sync offline data when online",
                        checked = settings.autoSync,
                        onCheckedChange = { viewModel.updateAutoSync(it) }
                    )
                    SettingsToggle(
                        title = "WiFi Only Sync",
                        description = "Only sync when connected to WiFi",
                        checked = settings.wifiOnlySync,
                        onCheckedChange = { viewModel.updateWifiOnlySync(it) }
                    )
                    
                    Button(
                        onClick = { viewModel.syncNow() },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = syncStatus !is SyncStatus.Syncing
                    ) {
                        when (syncStatus) {
                            is SyncStatus.Syncing -> {
                                Text("Syncing...")
                            }
                            is SyncStatus.Success -> {
                                Icon(Icons.Default.Sync, contentDescription = "Sync")
                                Spacer(modifier = Modifier.padding(horizontal = 4.dp))
                                Text("Sync Now (${syncStatus.count} pending)")
                            }
                            is SyncStatus.Error -> {
                                Text("Retry Sync")
                            }
                            else -> {
                                Text("Sync Now")
                            }
                        }
                    }
                }
            }
            
            // Location Settings
            Text(
                text = "Location Settings",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    SettingsToggle(
                        title = "Include Location",
                        description = "Include location data in verification requests",
                        checked = settings.includeLocation,
                        onCheckedChange = { viewModel.updateIncludeLocation(it) }
                    )
                    SettingsToggle(
                        title = "Precise Location",
                        description = "Use precise GPS location (higher battery usage)",
                        checked = settings.preciseLocation,
                        onCheckedChange = { viewModel.updatePreciseLocation(it) }
                    )
                }
            }
            
            // App Info
            Text(
                text = "App Information",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    InfoRow("Version", "1.0.0")
                    InfoRow("Build", "1001")
                    InfoRow("Database Size", "${settings.databaseSize} MB")
                    InfoRow("Cached Codes", settings.cachedCodes.toString())
                    InfoRow("Offline Queue", settings.offlineQueue.toString())
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SettingsItem(
    title: String,
    description: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun SettingsToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange
            )
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
    }
}