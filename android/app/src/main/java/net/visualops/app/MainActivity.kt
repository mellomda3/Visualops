package net.visualops.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import net.visualops.app.ui.VisualopsRoot
import net.visualops.app.ui.theme.VisualopsTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VisualopsTheme {
                VisualopsRoot()
            }
        }
    }
}
