package com.enoviq.ai.scanning.wine

import android.graphics.Bitmap
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.enoviq.ai.scanning.common.CameraXController
import java.io.InputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WineScanScreen(
    viewModel: WineScanViewModel,
    onBack: () -> Unit,
    onNavigateToMenuScan: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scanState by viewModel.scanState.collectAsState()
    val isEditing by viewModel.isEditing.collectAsState()
    val editingWine by viewModel.editingWine.collectAsState()
    val scanHistory by viewModel.scannedHistory.collectAsState()

    var cameraXController by remember { mutableStateOf<CameraXController?>(null) }
    val previewView = remember { PreviewView(context) }

    // Laser position animation
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

    // Image Picker Launcher for Photo Gallery fallback
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                if (bitmap != null) {
                    viewModel.scanImage(bitmap)
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
                        "ENOVIQ VISION",
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
                actions = {
                    IconButton(onClick = onNavigateToMenuScan) {
                        Icon(Icons.Default.RestaurantMenu, contentDescription = "Switch to Menu Scan", tint = Color.White)
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
                is WineScanState.Idle -> {
                    // Full Screen Camera Viewport
                    AndroidView(
                        factory = { previewView },
                        modifier = Modifier.fillMaxSize()
                    )

                    // Target Overlay Framing
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.4f))
                    ) {
                        // Golden Focus Target
                        Box(
                            modifier = Modifier
                                .size(280.dp, 320.dp)
                                .align(Alignment.Center)
                                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                                .clip(RoundedCornerShape(24.dp))
                        ) {
                            // Scanner Laser Canvas line
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

                            // Interactive Brackets in corners
                            CornerBrackets()
                        }

                        // Guidance HUD label
                        Column(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .padding(top = 400.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                "ALIGN WINE LABEL",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 2.sp,
                                    color = Color(0xFFC8A24A)
                                )
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                "Laser contrast auto-optimizing...",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color.LightGray
                                )
                            )
                        }
                    }

                    // Bottom Control Tray
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 48.dp, start = 32.dp, end = 32.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Gallery button
                        IconButton(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            modifier = Modifier
                                .size(56.dp)
                                .background(Color.DarkGray.copy(alpha = 0.5f), CircleShape)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = "Photo Gallery", tint = Color.White)
                        }

                        // Shutter button
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
                                                    viewModel.scanImage(bitmap)
                                                }
                                            } catch (e: Exception) {
                                                e.printStackTrace()
                                            }
                                        },
                                        onError = { /* Handle camera captures error */ }
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

                        // Toggle button or empty placeholder
                        Box(modifier = Modifier.size(56.dp))
                    }
                }

                is WineScanState.Processing -> {
                    // Futuristic processing overlay
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF050505))
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = Color(0xFFC8A24A),
                            strokeWidth = 4.dp,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            "RUNNING OCR ANALYSIS",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 3.sp,
                                color = Color(0xFFC8A24A)
                            )
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Segmenting wine bottle label & resolving directory matches...",
                            style = MaterialTheme.typography.bodySmall.copy(color = Color.Gray),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                is WineScanState.Success -> {
                    // Success View showcasing structured details
                    WineDetailsCard(
                        wine = state.wineDetails,
                        onReset = { viewModel.resetScanner() },
                        onEdit = { viewModel.startEditing(state.wineDetails) }
                    )
                }

                is WineScanState.Error -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.ErrorOutline,
                            contentDescription = "Error",
                            tint = Color.Red,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Scan Failed", style = MaterialTheme.typography.titleMedium, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            state.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
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

            // Manual Verification Edit Overlay
            if (isEditing && editingWine != null) {
                ManualEditForm(
                    wine = editingWine!!,
                    onSave = { updated -> viewModel.finishEditing(updated) },
                    onDismiss = { viewModel.dismissEditing() }
                )
            }
        }
    }
}

@Composable
fun CornerBrackets() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val stroke = 8f
        val len = 48f
        val color = Color(0xFFC8A24A)

        // Top-Left
        drawLine(color, Offset(0f, 0f), Offset(len, 0f), stroke)
        drawLine(color, Offset(0f, 0f), Offset(0f, len), stroke)

        // Top-Right
        drawLine(color, Offset(size.width, 0f), Offset(size.width - len, 0f), stroke)
        drawLine(color, Offset(size.width, 0f), Offset(size.width, len), stroke)

        // Bottom-Left
        drawLine(color, Offset(0f, size.height), Offset(len, size.height), stroke)
        drawLine(color, Offset(0f, size.height), Offset(0f, size.height - len), stroke)

        // Bottom-Right
        drawLine(color, Offset(size.width, size.height), Offset(size.width - len, size.height), stroke)
        drawLine(color, Offset(size.width, size.height), Offset(size.width, size.height - len), stroke)
    }
}

@Composable
fun WineDetailsCard(
    wine: WineDetails,
    onReset: () -> Unit,
    onEdit: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F0F0F), RoundedCornerShape(24.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            wine.grape.uppercase(),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFC8A24A),
                                letterSpacing = 2.sp
                            )
                        )

                        // Confidence Indicator Score Badge
                        Box(
                            modifier = Modifier
                                .background(Color(0xFFC8A24A).copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFFC8A24A).copy(alpha = 0.2f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, py = 4.dp)
                        ) {
                            Text(
                                "MATCH: ${wine.match}",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Color(0xFFC8A24A),
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        wine.name,
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("VINTAGE: ${wine.vintage}", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
                        Text("•", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        Text(wine.region, style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                    Spacer(modifier = Modifier.height(16.dp))

                    Text("Sommelier Notes", style = MaterialTheme.typography.titleSmall, color = Color(0xFFC8A24A))
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(wine.notes, style = MaterialTheme.typography.bodySmall, color = Color.Gray)

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("RATING", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text("${wine.rating} pts", style = MaterialTheme.typography.bodyMedium, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                        Column {
                            Text("ABV", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(wine.abv, style = MaterialTheme.typography.bodyMedium, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                        Column {
                            Text("DECANT", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(wine.decant, style = MaterialTheme.typography.bodyMedium, color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF0F0F0F), RoundedCornerShape(24.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
                    .padding(20.dp)
            ) {
                Column {
                    Text("Expert Food Pairings", style = MaterialTheme.typography.titleSmall, color = Color(0xFFC8A24A))
                    Spacer(modifier = Modifier.height(12.dp))
                    wine.pairings.forEach { pairing ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Restaurant, contentDescription = null, tint = Color(0xFFC8A24A), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(pairing, style = MaterialTheme.typography.bodySmall, color = Color.LightGray)
                        }
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onEdit,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                ) {
                    Text("Verify Details")
                }

                Button(
                    onClick = onReset,
                    modifier = Modifier.weight(1.5f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC8A24A))
                ) {
                    Text("Scan Next Bottle", color = Color.Black)
                }
            }
        }
    }
}

@Composable
fun ManualEditForm(
    wine: WineDetails,
    onSave: (WineDetails) -> Unit,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf(wine.name) }
    var vintage by remember { mutableStateOf(wine.vintage) }
    var grape by remember { mutableStateOf(wine.grape) }
    var region by remember { mutableStateOf(wine.region) }
    var ratingString by remember { mutableStateOf(wine.rating.toString()) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth().wrapContentHeight(),
            shape = RoundedCornerShape(28.dp),
            color = Color(0xFF0F0F0F),
            border = BorderStroke(1.dp, Color(0xFFC8A24A).copy(alpha = 0.2f))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    "VERIFY SCANNED DETAILS",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFC8A24A),
                        letterSpacing = 2.sp
                    )
                )

                Text(
                    "We detected low-confidence matching metrics on this label OCR scan. Please double check the fields below before adding to your repository.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Wine Brand & Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.LightGray,
                        focusedBorderColor = Color(0xFFC8A24A)
                    )
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = vintage,
                        onValueChange = { vintage = it },
                        label = { Text("Vintage Year") },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.LightGray,
                            focusedBorderColor = Color(0xFFC8A24A)
                        )
                    )

                    OutlinedTextField(
                        value = ratingString,
                        onValueChange = { ratingString = it },
                        label = { Text("Rating") },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.LightGray,
                            focusedBorderColor = Color(0xFFC8A24A)
                        )
                    )
                }

                OutlinedTextField(
                    value = grape,
                    onValueChange = { grape = it },
                    label = { Text("Primary Grape") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.LightGray,
                        focusedBorderColor = Color(0xFFC8A24A)
                    )
                )

                OutlinedTextField(
                    value = region,
                    onValueChange = { region = it },
                    label = { Text("Wine Region") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.LightGray,
                        focusedBorderColor = Color(0xFFC8A24A)
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Discard", color = Color.Gray)
                    }

                    Button(
                        onClick = {
                            val score = ratingString.toIntOrNull() ?: 90
                            onSave(
                                wine.copy(
                                    name = name,
                                    vintage = vintage,
                                    grape = grape,
                                    region = region,
                                    rating = score,
                                    confidence = 1.0,
                                    match = "100%"
                                )
                            )
                        },
                        modifier = Modifier.weight(1.5f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC8A24A))
                    ) {
                        Text("Verify & Save", color = Color.Black)
                    }
                }
            }
        }
    }
}
