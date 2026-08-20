package net.visualops.app.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import net.visualops.app.AppConfig
import net.visualops.app.VisualopsApplication
import net.visualops.app.data.local.SyncJob
import net.visualops.app.data.remote.VisualopsApi
import net.visualops.app.sync.SessionStore
import org.json.JSONObject

private val tabs = listOf(
    Triple("recepcion", "Recepción", Icons.Filled.Add),
    Triple("graduacion", "Graduación", Icons.Filled.Visibility),
    Triple("optico", "Óptico", Icons.Filled.RemoveRedEye),
    Triple("panel", "Panel", Icons.Filled.Dashboard),
)

@Composable
fun VisualopsRoot() {
    var loggedIn by remember { mutableStateOf(SessionStore.accessToken != null) }
    if (!loggedIn) {
        LoginScreen(onLoggedIn = { loggedIn = true })
    } else {
        MainShell()
    }
}

@Composable
private fun LoginScreen(onLoggedIn: () -> Unit) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .imePadding()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Visualops", style = MaterialTheme.typography.headlineLarge)
        Text("Puesto de terreno", style = MaterialTheme.typography.bodyMedium)
        if (!AppConfig.isConfigured) {
            Text(
                "Configurá SUPABASE_URL en AppConfig.kt (mismo proyecto que la web).",
                modifier = Modifier.padding(top = 12.dp),
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            visualTransformation = PasswordVisualTransformation(),
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
        Button(
            onClick = {
                busy = true
                error = null
                scope.launch {
                    try {
                        val api = VisualopsApi { SessionStore.accessToken }
                        val json = withContext(Dispatchers.IO) { api.login(email.trim(), password) }
                        SessionStore.accessToken = json.getString("access_token")
                        onLoggedIn()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo entrar"
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy && AppConfig.isConfigured,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
        ) {
            Text(if (busy) "Entrando…" else "Entrar")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainShell() {
    val nav = rememberNavController()
    val route = nav.currentBackStackEntryAsState().value?.destination?.route
    Scaffold(
        topBar = { TopAppBar(title = { Text("Visualops") }) },
        bottomBar = {
            NavigationBar {
                tabs.forEach { (id, label, icon) ->
                    NavigationBarItem(
                        selected = route == id,
                        onClick = { nav.navigate(id) { launchSingleTop = true } },
                        icon = { Icon(icon, contentDescription = label) },
                        label = { Text(label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(navController = nav, startDestination = "recepcion", modifier = Modifier.padding(padding)) {
            composable("recepcion") { RecepcionScreen() }
            composable("graduacion") { QueueScreen("status=eq.precargada", "Cola de graduación") }
            composable("optico") { OpticoScreen() }
            composable("panel") { QueueScreen("select=*&order=created_at.desc", "Fichas") }
        }
    }
}

@Composable
private fun RecepcionScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var campaignId by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Alta rápida", style = MaterialTheme.typography.titleLarge)
        OutlinedTextField(campaignId, { campaignId = it }, label = { Text("ID campaña") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(name, { name = it }, label = { Text("Nombre y apellido") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            phone,
            { phone = it },
            label = { Text("Teléfono") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(city, { city = it }, label = { Text("Localidad") }, modifier = Modifier.fillMaxWidth())
        Button(
            onClick = {
                scope.launch {
                    val payload = JSONObject()
                        .put("campaign_id", campaignId.trim())
                        .put("full_name", name.trim())
                        .put("phone", phone.trim())
                        .put("city", city.trim())
                        .put("street", "")
                        .put("insurance", "")
                        .put("recipe_nro", "")
                    try {
                        val api = VisualopsApi { SessionStore.accessToken }
                        val nro = withContext(Dispatchers.IO) {
                            api.rpc("next_ficha_nro", JSONObject().put("p_campaign_id", campaignId.trim()))
                        }
                        payload.put("ficha_nro", nro).put("status", "precargada")
                        withContext(Dispatchers.IO) { api.post("records", payload) }
                        message = "Ficha $nro guardada en el servidor"
                    } catch (e: Exception) {
                        val db = (context.applicationContext as VisualopsApplication).database
                        db.syncJobDao().insert(SyncJob(kind = "create_record", payloadJson = payload.toString()))
                        message = "Sin red: quedó en cola y se sube después"
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Guardar precarga") }
        if (message.isNotBlank()) Text(message)
    }
}

@Composable
private fun QueueScreen(query: String, title: String) {
    val scope = rememberCoroutineScope()
    var lines by remember { mutableStateOf(listOf("Deslizá para cargar…")) }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text(title, style = MaterialTheme.typography.titleLarge)
        Button(onClick = {
            scope.launch {
                try {
                    val api = VisualopsApi { SessionStore.accessToken }
                    val arr = withContext(Dispatchers.IO) { api.get("records?$query") }
                    lines = (0 until arr.length()).map {
                        val o = arr.getJSONObject(it)
                        "${o.optString("ficha_nro")} · ${o.optString("full_name")} · ${o.optString("status")}"
                    }.ifEmpty { listOf("Sin fichas") }
                } catch (e: Exception) {
                    lines = listOf(e.message ?: "Error")
                }
            }
        }) { Text("Actualizar") }
        LazyColumn(contentPadding = PaddingValues(top = 12.dp)) {
            items(lines) { Text(it, modifier = Modifier.padding(vertical = 8.dp)) }
        }
    }
}

@Composable
private fun OpticoScreen() {
    val context = LocalContext.current
    var recordId by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        if (uri == null || recordId.isBlank()) return@rememberLauncherForActivityResult
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return@rememberLauncherForActivityResult
        val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
        val path = "$recordId/${System.currentTimeMillis()}-adjunto"
        Thread {
            try {
                val api = VisualopsApi { SessionStore.accessToken }
                api.uploadFile(path, bytes, mime)
                api.post(
                    "files",
                    JSONObject()
                        .put("record_id", recordId)
                        .put("path", path)
                        .put("name", "adjunto")
                        .put("mime_type", mime)
                        .put("size_bytes", bytes.size)
                        .put("kind", "receta"),
                )
            } catch (_: Exception) {
            }
        }.start()
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Pedido y archivos", style = MaterialTheme.typography.titleLarge)
        OutlinedTextField(recordId, { recordId = it }, label = { Text("ID ficha") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(name, { name = it }, label = { Text("Nombre (WhatsApp)") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(phone, { phone = it }, label = { Text("Teléfono") }, modifier = Modifier.fillMaxWidth())
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { picker.launch("image/*") }) {
                Icon(Icons.Filled.CameraAlt, contentDescription = null)
                Text("  Adjuntar receta")
            }
        }
        Button(onClick = {
            val digits = phone.filter { it.isDigit() }
            val url = "https://wa.me/54$digits?text=" + Uri.encode("Hola $name, tu ficha Visualops quedó registrada.")
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }) { Text("WhatsApp") }
        QueueScreen("status=in.(graduada,pendiente,confirmada,entregada)", "En óptico")
    }
}
