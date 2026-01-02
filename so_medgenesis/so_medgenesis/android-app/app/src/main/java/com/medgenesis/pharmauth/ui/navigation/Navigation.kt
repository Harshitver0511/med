package com.medgenesis.pharmauth.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.medgenesis.pharmauth.ui.screens.HistoryScreen
import com.medgenesis.pharmauth.ui.screens.HomeScreen
import com.medgenesis.pharmauth.ui.screens.ScanScreen
import com.medgenesis.pharmauth.ui.screens.SettingsScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(navController)
        }
        composable(Screen.Scan.route) {
            ScanScreen(navController)
        }
        composable(Screen.History.route) {
            HistoryScreen(navController)
        }
        composable(Screen.Settings.route) {
            SettingsScreen(navController)
        }
    }
}

sealed class Screen(val route: String, val title: String) {
    object Home : Screen("home", "Home")
    object Scan : Screen("scan", "Scan Package")
    object History : Screen("history", "Verification History")
    object Settings : Screen("settings", "Settings")
}