package com.medgenesis.pharmauth.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.medgenesis.pharmauth.data.model.VerificationResult
import com.medgenesis.pharmauth.ui.components.BottomNavigationBar
import com.medgenesis.pharmauth.ui.components.QRScannerView
import com.medgenesis.pharmauth.ui.viewmodel.ScanViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    navController: NavController,
    viewModel: ScanViewModel = viewModel(factory = ScanViewModel.Factory)
) {
    val context = LocalContext.current
    val uiState = viewModel.uiState
    var showCamera by remember { mutableStateOf(false) }
    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.onPermissionGranted()
            showCamera = true // Show camera after permission granted
        } else {
            viewModel.onPermissionDenied()
        }
    }
    
    // Check camera permission on launch
    LaunchedEffect(Unit) {
        when {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                viewModel.onPermissionGranted()
            }
            else -> {
                permissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }
    
    // Show camera scanner when scanning
    if (showCamera && uiState !is ScanViewModel.UiState.Loading) {
        QRScannerView(
            onQRCodeScanned = { qrCode ->
                showCamera = false
                viewModel.verifyScannedCode(qrCode)
            },
            onClose = {
                showCamera = false
                viewModel.resetState()
            }
        )
    } else {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Scan Package") },
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
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                when (uiState) {
                    is ScanViewModel.UiState.Idle -> {
                        ScanIdleView(onScanClick = { showCamera = true })
                    }
                    is ScanViewModel.UiState.Loading -> {
                        ScanLoadingView()
                    }
                    is ScanViewModel.UiState.Success -> {
                        ScanSuccessView(
                            result = uiState.result,
                            onScanAgain = { 
                                viewModel.resetState()
                                showCamera = true 
                            }
                        )
                    }
                    is ScanViewModel.UiState.Error -> {
                        ScanErrorView(
                            message = uiState.message,
                            onRetry = { 
                                viewModel.resetState()
                                showCamera = true 
                            }
                        )
                    }
                    is ScanViewModel.UiState.PermissionDenied -> {
                        PermissionDeniedView(
                            onRequestPermission = {
                                permissionLauncher.launch(Manifest.permission.CAMERA)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ScanIdleView(onScanClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Icon(
            imageVector = Icons.Default.QrCodeScanner,
            contentDescription = "Scan QR Code",
            modifier = Modifier.height(120.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "Scan Medicine Package",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "Point your camera at the QR code on the medicine package to verify its authenticity",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            modifier = Modifier.padding(horizontal = 32.dp),
            textAlign = TextAlign.Center
        )
        
        Button(
            onClick = onScanClick,
            modifier = Modifier.fillMaxWidth(0.7f)
        ) {
            Text("Start Scanning")
        }
    }
}

@Composable
private fun ScanLoadingView() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        CircularProgressIndicator()
        Text(
            text = "Verifying package...",
            style = MaterialTheme.typography.bodyLarge
        )
    }
}

@Composable
private fun ScanSuccessView(result: VerificationResult, onScanAgain: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when (result) {
            is VerificationResult.Authentic -> {
                ResultCard(
                    title = "✓ Authentic Product",
                    subtitle = "This medicine package is verified as authentic",
                    backgroundColor = Color(0xFFDCFCE7),
                    contentColor = Color(0xFF166534)
                ) {
                    ProductInfo(result)
                }
            }
            is VerificationResult.Suspicious -> {
                ResultCard(
                    title = "⚠ Suspicious Product",
                    subtitle = result.reason,
                    backgroundColor = Color(0xFFFEF3C7),
                    contentColor = Color(0xFF92400E)
                )
            }
            is VerificationResult.Invalid -> {
                ResultCard(
                    title = "✗ Invalid Code",
                    subtitle = result.reason,
                    backgroundColor = Color(0xFFFEE2E2),
                    contentColor = Color(0xFF991B1B)
                )
            }
            is VerificationResult.Unverified -> {
                ResultCard(
                    title = "? Unverified",
                    subtitle = result.reason,
                    backgroundColor = Color(0xFFF3F4F6),
                    contentColor = Color(0xFF374151)
                )
            }
        }
        
        Button(
            onClick = onScanAgain,
            modifier = Modifier.fillMaxWidth(0.7f)
        ) {
            Text("Scan Another Package")
        }
    }
}

@Composable
private fun ScanErrorView(message: String, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ResultCard(
            title = "Error",
            subtitle = message,
            backgroundColor = Color(0xFFFEE2E2),
            contentColor = Color(0xFF991B1B)
        )
        
        Button(
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(0.7f)
        ) {
            Text("Try Again")
        }
    }
}

@Composable
private fun PermissionDeniedView(onRequestPermission: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Camera Permission Required",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "This app needs camera permission to scan QR codes on medicine packages",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            textAlign = TextAlign.Center
        )
        
        Button(
            onClick = onRequestPermission,
            modifier = Modifier.fillMaxWidth(0.7f)
        ) {
            Text("Grant Permission")
        }
    }
}

@Composable
private fun ResultCard(
    title: String,
    subtitle: String,
    backgroundColor: Color,
    contentColor: Color,
    content: @Composable () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = backgroundColor
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = contentColor
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = contentColor
            )
            content()
        }
    }
}

@Composable
private fun ProductInfo(result: VerificationResult.Authentic) {
    Column(
        modifier = Modifier.padding(top = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        InfoRow("Product", result.productName)
        InfoRow("Manufacturer", result.manufacturerId)
        InfoRow("Batch", result.batchId)
        InfoRow("Confidence", "${(result.confidence * 100).toInt()}%")
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
    }
}