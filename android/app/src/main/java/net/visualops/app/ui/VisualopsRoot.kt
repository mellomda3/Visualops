package net.visualops.app.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenu
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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

private data class CampaignOpt(val id: String, val label: String)
private data class RecordRow(
    val id: String,
    val ficha: String,
    val name: String,
    val status: String,
    val phone: String = "",
)

private val tabs = listOf(
    Triple("recepcion", "Recepción", Icons.Filled.Add),
    Triple("graduacion", "Graduación", Icons.Filled.Visibility),
    Triple("optico", "Óptico", Icons.Filled.RemoveRedEye),
    Triple("panel", "Panel", Icons.Filled.Dashboard),
)

@Composable
fun VisualopsRoot() {
    val context = LocalContext.current
    LaunchedEffect(Unit) { SessionStore.init(context) }
    var loggedIn by remember { mutableStateOf(SessionStore.accessToken != null) }
    if (!loggedIn) {
        LoginScreen(onLoggedIn = { loggedIn = true })
    } else {
        MainShell(onLogout = {
            SessionStore.clear(context)
            loggedIn = false
        })
    }
}

@Composable
private fun LoginScreen(onLoggedIn: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("admin@visualops.local") }
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
                "Configurá SUPABASE_URL y SUPABASE_ANON_KEY en android/local.properties",
                modifier = Modifier.padding(top = 12.dp),
                color = MaterialTheme.colorScheme.secondary,
            )
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            visualTransformation = PasswordVisualTransformation(),
        )
        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
        Button(
            onClick = {
                busy = true
                error = null
                scope.launch {
                    try {
                        val api = VisualopsApi { SessionStore.accessToken }
                        val json = withContext(Dispatchers.IO) { api.login(email.trim(), password) }
                        SessionStore.save(context, json.getString("access_token"))
                        onLoggedIn()
                    } catch (e: Exception) {
                        error = e.message ?: "No se pudo entrar"
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy && AppConfig.isConfigured,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp),
        ) {
            Text(if (busy) "Entrando…" else "Entrar")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainShell(onLogout: () -> Unit) {
    val nav = rememberNavController()
    val route = nav.currentBackStackEntryAsState().value?.destination?.route
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Visualops") },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Salir")
                    }
                },
            )
        },
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
        NavHost(
            navController = nav,
            startDestination = "recepcion",
            modifier = Modifier.padding(padding),
        ) {
            composable("recepcion") { RecepcionScreen() }
            composable("graduacion") { GraduacionScreen() }
            composable("optico") { OpticoScreen() }
            composable("panel") { QueueScreen("select=*&order=created_at.desc", "Fichas") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RecepcionScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var campaigns by remember { mutableStateOf(listOf<CampaignOpt>()) }
    var campaignId by remember { mutableStateOf("") }
    var campaignOpen by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val api = VisualopsApi { SessionStore.accessToken }
            val arr = withContext(Dispatchers.IO) {
                api.get("campaigns?select=id,name,location,date&order=date.desc")
            }
            campaigns = (0 until arr.length()).map {
                val o = arr.getJSONObject(it)
                CampaignOpt(
                    o.getString("id"),
                    "${o.optString("name")} · ${o.optString("location")}",
                )
            }
            if (campaignId.isBlank()) campaignId = campaigns.firstOrNull()?.id.orEmpty()
        } catch (e: Exception) {
            message = e.message ?: "No se pudieron cargar campañas"
        }
    }

    val selectedLabel = campaigns.find { it.id == campaignId }?.label ?: "Elegí campaña"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Alta rápida", style = MaterialTheme.typography.titleLarge)
        ExposedDropdownMenuBox(expanded = campaignOpen, onExpandedChange = { campaignOpen = it }) {
            OutlinedTextField(
                value = selectedLabel,
                onValueChange = {},
                readOnly = true,
                label = { Text("Campaña") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = campaignOpen) },
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth(),
            )
            ExposedDropdownMenu(expanded = campaignOpen, onDismissRequest = { campaignOpen = false }) {
                campaigns.forEach { c ->
                    DropdownMenuItem(
                        text = { Text(c.label) },
                        onClick = {
                            campaignId = c.id
                            campaignOpen = false
                        },
                    )
                }
            }
        }
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
                if (campaignId.isBlank() || name.isBlank()) {
                    message = "Campaña y nombre son obligatorios"
                    return@Button
                }
                busy = true
                scope.launch {
                    val payload = JSONObject()
                        .put("campaign_id", campaignId)
                        .put("full_name", name.trim())
                        .put("phone", phone.trim())
                        .put("city", city.trim())
                        .put("street", "")
                        .put("insurance", "")
                        .put("recipe_nro", "")
                    try {
                        val api = VisualopsApi { SessionStore.accessToken }
                        val nro = withContext(Dispatchers.IO) {
                            api.rpc("next_ficha_nro", JSONObject().put("p_campaign_id", campaignId))
                        }
                        payload.put("ficha_nro", nro).put("status", "precargada")
                        withContext(Dispatchers.IO) { api.post("records", payload) }
                        message = "Ficha $nro guardada"
                        name = ""
                        phone = ""
                        city = ""
                    } catch (e: Exception) {
                        val db = (context.applicationContext as VisualopsApplication).database
                        db.syncJobDao().insert(SyncJob(kind = "create_record", payloadJson = payload.toString()))
                        message = "Sin red: quedó en cola offline"
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (busy) "Guardando…" else "Guardar precarga") }
        if (message.isNotBlank()) Text(message)
    }
}

@Composable
private fun GraduacionScreen() {
    val scope = rememberCoroutineScope()
    var queue by remember { mutableStateOf(listOf<RecordRow>()) }
    var selected by remember { mutableStateOf<RecordRow?>(null) }
    var odSph by remember { mutableStateOf("") }
    var odCyl by remember { mutableStateOf("") }
    var odAxis by remember { mutableStateOf("") }
    var osSph by remember { mutableStateOf("") }
    var osCyl by remember { mutableStateOf("") }
    var osAxis by remember { mutableStateOf("") }
    var add by remember { mutableStateOf("") }
    var dnp by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }

    fun loadQueue() {
        scope.launch {
            try {
                val api = VisualopsApi { SessionStore.accessToken }
                val arr = withContext(Dispatchers.IO) {
                    api.get("records?status=eq.precargada&select=id,ficha_nro,full_name,status,phone&order=created_at.asc")
                }
                queue = (0 until arr.length()).map {
                    val o = arr.getJSONObject(it)
                    RecordRow(
                        o.getString("id"),
                        o.optString("ficha_nro"),
                        o.optString("full_name"),
                        o.optString("status"),
                        o.optString("phone"),
                    )
                }
            } catch (e: Exception) {
                message = e.message ?: "Error al cargar cola"
            }
        }
    }

    LaunchedEffect(Unit) { loadQueue() }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Cola de graduación", style = MaterialTheme.typography.titleLarge)
            OutlinedButton(onClick = { loadQueue() }) { Text("Actualizar") }
        }
        queue.forEach { row ->
            Text(
                "${row.ficha} · ${row.name}",
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        selected = row
                        message = ""
                    }
                    .padding(vertical = 6.dp),
                color = if (selected?.id == row.id) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
            )
        }
        if (queue.isEmpty()) Text("Sin precargas pendientes")

        selected?.let { rec ->
            Text("Ficha ${rec.ficha}", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(odSph, { odSph = it }, label = { Text("OD sph") }, modifier = Modifier.weight(1f))
                OutlinedTextField(odCyl, { odCyl = it }, label = { Text("OD cyl") }, modifier = Modifier.weight(1f))
                OutlinedTextField(odAxis, { odAxis = it }, label = { Text("OD eje") }, modifier = Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(osSph, { osSph = it }, label = { Text("OS sph") }, modifier = Modifier.weight(1f))
                OutlinedTextField(osCyl, { osCyl = it }, label = { Text("OS cyl") }, modifier = Modifier.weight(1f))
                OutlinedTextField(osAxis, { osAxis = it }, label = { Text("OS eje") }, modifier = Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(add, { add = it }, label = { Text("Add") }, modifier = Modifier.weight(1f))
                OutlinedTextField(dnp, { dnp = it }, label = { Text("DNP") }, modifier = Modifier.weight(1f))
            }
            OutlinedTextField(notes, { notes = it }, label = { Text("Notas") }, modifier = Modifier.fillMaxWidth())
            Button(
                onClick = {
                    busy = true
                    scope.launch {
                        try {
                            val api = VisualopsApi { SessionStore.accessToken }
                            val body = JSONObject()
                                .put("record_id", rec.id)
                                .putOptNum("od_sph", odSph)
                                .putOptNum("od_cyl", odCyl)
                                .putOptNum("od_axis", odAxis)
                                .putOptNum("os_sph", osSph)
                                .putOptNum("os_cyl", osCyl)
                                .putOptNum("os_axis", osAxis)
                                .putOptNum("add_power", add)
                                .putOptNum("dnp", dnp)
                                .put("notes", notes.ifBlank { JSONObject.NULL })
                            withContext(Dispatchers.IO) {
                                api.post("refractions", body)
                                api.patch("records?id=eq.${rec.id}", JSONObject().put("status", "graduada"))
                            }
                            message = "Graduada ${rec.ficha}"
                            selected = null
                            odSph = ""; odCyl = ""; odAxis = ""
                            osSph = ""; osCyl = ""; osAxis = ""
                            add = ""; dnp = ""; notes = ""
                            loadQueue()
                        } catch (e: Exception) {
                            message = e.message ?: "No se pudo guardar"
                        } finally {
                            busy = false
                        }
                    }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (busy) "Guardando…" else "Guardar graduación") }
        }
        if (message.isNotBlank()) Text(message)
    }
}

@Composable
private fun QueueScreen(query: String, title: String) {
    val scope = rememberCoroutineScope()
    var lines by remember { mutableStateOf(listOf("Cargando…")) }

    fun refresh() {
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
    }

    LaunchedEffect(query) { refresh() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            OutlinedButton(onClick = { refresh() }) { Text("Actualizar") }
        }
        LazyColumn(contentPadding = PaddingValues(top = 12.dp)) {
            items(lines) { Text(it, modifier = Modifier.padding(vertical = 8.dp)) }
        }
    }
}

@Composable
private fun OpticoScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var queue by remember { mutableStateOf(listOf<RecordRow>()) }
    var selected by remember { mutableStateOf<RecordRow?>(null) }
    var lens by remember { mutableStateOf("") }
    var frame by remember { mutableStateOf("") }
    var total by remember { mutableStateOf("") }
    var deposit by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        val rec = selected ?: return@rememberLauncherForActivityResult
        if (uri == null) return@rememberLauncherForActivityResult
        val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return@rememberLauncherForActivityResult
        val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
        val path = "${rec.id}/${System.currentTimeMillis()}-adjunto"
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val api = VisualopsApi { SessionStore.accessToken }
                    api.uploadFile(path, bytes, mime)
                    api.post(
                        "files",
                        JSONObject()
                            .put("record_id", rec.id)
                            .put("path", path)
                            .put("name", "adjunto")
                            .put("mime_type", mime)
                            .put("size_bytes", bytes.size)
                            .put("kind", "receta"),
                    )
                }
                message = "Archivo subido"
            } catch (e: Exception) {
                message = e.message ?: "No se pudo subir"
            }
        }
    }

    fun loadQueue() {
        scope.launch {
            try {
                val api = VisualopsApi { SessionStore.accessToken }
                val arr = withContext(Dispatchers.IO) {
                    api.get(
                        "records?status=in.(graduada,pendiente,confirmada)&select=id,ficha_nro,full_name,status,phone&order=updated_at.desc",
                    )
                }
                queue = (0 until arr.length()).map {
                    val o = arr.getJSONObject(it)
                    RecordRow(
                        o.getString("id"),
                        o.optString("ficha_nro"),
                        o.optString("full_name"),
                        o.optString("status"),
                        o.optString("phone"),
                    )
                }
            } catch (e: Exception) {
                message = e.message ?: "Error al cargar"
            }
        }
    }

    LaunchedEffect(Unit) { loadQueue() }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Óptico", style = MaterialTheme.typography.titleLarge)
            OutlinedButton(onClick = { loadQueue() }) { Text("Actualizar") }
        }
        queue.forEach { row ->
            Text(
                "${row.ficha} · ${row.name} · ${row.status}",
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { selected = row; message = "" }
                    .padding(vertical = 6.dp),
                color = if (selected?.id == row.id) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
            )
        }

        selected?.let { rec ->
            Text("Pedido ${rec.ficha}", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(lens, { lens = it }, label = { Text("Lente") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(frame, { frame = it }, label = { Text("Armazón") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(total, { total = it }, label = { Text("Total") }, modifier = Modifier.weight(1f))
                OutlinedTextField(deposit, { deposit = it }, label = { Text("Seña") }, modifier = Modifier.weight(1f))
            }
            Button(
                onClick = {
                    busy = true
                    scope.launch {
                        try {
                            val api = VisualopsApi { SessionStore.accessToken }
                            val body = JSONObject()
                                .put("record_id", rec.id)
                                .put("lens", lens)
                                .put("frame", frame)
                                .put("total", total.toDoubleOrNull() ?: 0.0)
                                .put("deposit", deposit.toDoubleOrNull() ?: 0.0)
                            withContext(Dispatchers.IO) {
                                api.post("orders", body)
                                api.patch("records?id=eq.${rec.id}", JSONObject().put("status", "pendiente"))
                            }
                            message = "Pedido guardado · pendiente"
                            loadQueue()
                        } catch (e: Exception) {
                            message = e.message ?: "Error al guardar pedido"
                        } finally {
                            busy = false
                        }
                    }
                },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (busy) "Guardando…" else "Guardar pedido") }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = { picker.launch("image/*") }) {
                    Icon(Icons.Filled.CameraAlt, contentDescription = null)
                    Text("  Adjuntar")
                }
                Button(onClick = {
                    val digits = rec.phone.filter { it.isDigit() }
                    val url = "https://wa.me/54$digits?text=" +
                        Uri.encode("Hola ${rec.name}, tu ficha ${rec.ficha} Visualops quedó registrada.")
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                }) { Text("WhatsApp") }
            }
        }
        if (message.isNotBlank()) Text(message)
    }
}

private fun JSONObject.putOptNum(key: String, raw: String): JSONObject {
    val n = raw.trim().toDoubleOrNull()
    if (n == null) put(key, JSONObject.NULL) else put(key, n)
    return this
}
