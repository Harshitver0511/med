package com.medgenesis.pharmauth.ui.components

import androidx.compose.foundation.layout.RowScope
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.medgenesis.pharmauth.ui.navigation.Screen

@Composable
fun BottomNavigationBar(navController: NavController) {
    val navBackStackEntry = navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry.value?.destination?.route
    
    BottomAppBar(
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        NavigationItem(
            icon = Icons.Default.Home,
            selected = currentRoute == Screen.Home.route,
            onClick = { navController.navigate(Screen.Home.route) }
        )
        NavigationItem(
            icon = Icons.Default.QrCodeScanner,
            selected = currentRoute == Screen.Scan.route,
            onClick = { navController.navigate(Screen.Scan.route) }
        )
        NavigationItem(
            icon = Icons.Default.History,
            selected = currentRoute == Screen.History.route,
            onClick = { navController.navigate(Screen.History.route) }
        )
        NavigationItem(
            icon = Icons.Default.Settings,
            selected = currentRoute == Screen.Settings.route,
            onClick = { navController.navigate(Screen.Settings.route) }
        )
    }
}

@Composable
private fun RowScope.NavigationItem(
    icon: ImageVector,
    selected: Boolean,
    onClick: () -> Unit
) {
    IconButton(
        onClick = onClick,
        modifier = Modifier.weight(1f)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (selected) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            }
        )
    }
}