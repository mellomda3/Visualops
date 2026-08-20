package net.visualops.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Ink = Color(0xFF0B1220)
private val Signal = Color(0xFF00C2A8)
private val Flare = Color(0xFFFF8A3D)

@Composable
fun VisualopsTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Signal,
            secondary = Flare,
            background = Ink,
            surface = Color(0xFF15233A),
            onPrimary = Ink,
            onBackground = Color.White,
            onSurface = Color.White,
        ),
        content = content,
    )
}
