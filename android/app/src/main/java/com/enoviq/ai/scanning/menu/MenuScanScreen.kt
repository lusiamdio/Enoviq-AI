package com.enoviq.ai.scanning.menu

import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.enoviq.ai.scanning.common.CameraXController
import com.enoviq.ai.scanning.wine.CornerBrackets
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScanScreen(
    viewModel: MenuScanViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scanState by viewModel.scanState.collectAsState()

    var cameraXController by remember { mutableStateOf<CameraXController?>(null) }
    val previewView = remember { PreviewView(context) }

    val infiniteTransition = rememberInfiniteTransition(label = "LaserTransition")
    val laserOffsetY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3500, ease = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LaserOffset"
    )

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                if (bitmap != null) {
                    viewModel.scanMenu(bitmap)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    LaunchedEffect(Unit) {
        cameraXController = CameraXController(context, lifecycleOwner, previewView).apply {
            startCamera()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            cameraXController?.shutDown()
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "MENU PAIRING AI",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 3.sp,
                            color = Color(0xFFC8A24A)
                        )
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color(0xFF050505)
                )
            )
        },
        containerColor = Color(0xFF050505)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (val state = scanState) {
                is MenuScanState.Idle -> {
                    AndroidView(
                        factory = { previewView },
                        modifier = Modifier.fillMaxSize()
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.4f))
                    ) {
                        Box(
                            modifier = Modifier
                                .size(290.dp, 350.dp)
                                .align(Alignment.Center)
                                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                                .clip(RoundedCornerShape(24.dp))
                        ) {
                            Canvas(modifier = Modifier.fillMaxSize()) {
                                val yPos = size.height * laserOffsetY
                                drawLine(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(Color.Transparent, Color(0xFFC8A24A), Color.Transparent)
                                    ),
                                    start = Offset(0f, yPos),
                                    end = Offset(size.width, yPos),
                                    strokeWidth = 6f
                                )
                            }
                            CornerBrackets()
                        }

                        Column(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .padding(top = 420.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                "ALIGN RESTAURANT FOOD MENU",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.5.sp,
                                    color = Color(0xFFC8A24A)
                                )
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                "Detects culinary dishes for expert matches...",
                                style = MaterialTheme.typography.labelSmall.copy(color = Color.LightGray)
                            )
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 48.dp, start = 32.dp, end = 32.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            modifier = Modifier
                                .size(56.dp)
                                .background(Color.DarkGray.copy(alpha = 0.5f), CircleShape)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = "Gallery", tint = Color.White)
                        }

                        Box(
                            modifier = Modifier
                                .size(84.dp)
                                .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                .clickable {
                                    cameraXController?.takePicture(
                                        onImageCaptured = { uri ->
                                            try {
                                                val inputStream = context.contentResolver.openInputStream(uri)
                                                val bitmap = BitmapFactory.decodeStream(inputStream)
                                                if (bitmap != null) {
                                                    viewModel.scanMenu(bitmap)
                                                }
                                            } catch (e: Exception) {
                                                e.printStackTrace()
                                            }
                                        },
                                        onError = {}
                                    )
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(68.dp)
                                    .background(Color(0xFFC8A24A), CircleShape)
                                    .border(4.dp, Color.Black, CircleShape)
                            )
                        }

                        Box(modifier = Modifier.size(56.dp))
                    }
                }

                is MenuScanState.Processing -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF050505))
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = Color(0xFFC8A24A), strokeWidth = 4.dp)
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            "ANALYZING CULINARY MENU ITEMS",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp,
                                color = Color(0xFFC8A24A)
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Searching wine registry for maximum culinary affinity...",
                            style = MaterialTheme.typography.bodySmall.copy(color = Color.Gray),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                is MenuScanState.Success -> {
                    MenuResultsList(result = state.result, onReset = { viewModel.resetScanner() })
                }

                is MenuScanState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.ErrorOutline, null, tint = Color.Red, modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Menu Scan Failed", color = Color.White)
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = { viewModel.resetScanner() },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC8A24A))
                        ) {
                            Text("Retry Scanner", color = Color.Black)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MenuResultsList(result: MenuScanResult, onReset: () -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                "DETECTED DISHES",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC8A24A),
                    letterSpacing = 1.5.sp
                )
            )
        }

        items(result.dishes) { dish ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F0F0F), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(dish.name, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(
                            dish.category.uppercase(),
                            style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFC8A24A))
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(dish.pairingNotes, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "RECOMMENDED WINES",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC8A24A),
                    letterSpacing = 1.5.sp
                )
            )
        }

        items(result.pairings) { pairing ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F0F0F), RoundedCornerShape(16.dp))
                    .border(BorderStroke(1.dp, Color(0xFFC8A24A).copy(alpha = 0.1f)), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(pairing.wine, fontWeight = FontWeight.Black, color = Color.White, fontSize = 16.sp)
                        Text(
                            "${pairing.match}% AFFINITY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFC8A24A)
                            )
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(pairing.style, style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        "Pairing Reason: ${pairing.reason}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
        }

        item {
            Button(
                onClick = onReset,
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC8A24A))
            ) {
                Text("Scan Another Menu", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    }
}
