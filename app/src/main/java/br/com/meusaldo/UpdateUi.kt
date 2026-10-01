package br.com.meusaldo

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import java.io.File

class UpdateFileProvider : FileProvider()

@Composable fun rememberUpdateInstaller(updater: UpdateViewModel): () -> Unit {
    val context = LocalContext.current
    val state by updater.state.collectAsStateWithLifecycle()
    var permissionPrompt by rememberSaveable { mutableStateOf(false) }
    var attemptedPath by rememberSaveable { mutableStateOf<String?>(null) }
    val installer = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        updater.message("Se a instalação foi cancelada, você pode tentar novamente. Seus registros continuam neste celular.")
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        if (context.packageManager.canRequestPackageInstalls()) updater.state.value.readyApk?.let { file ->
            openInstaller(context, file, updater) { intent -> installer.launch(intent) }
        } else updater.message("Instalação não autorizada. Você pode autorizar quando quiser atualizar.")
    }
    val install: () -> Unit = {
        updater.state.value.readyApk?.let { file ->
            if (!context.packageManager.canRequestPackageInstalls()) permissionPrompt = true
            else openInstaller(context, file, updater) { intent -> installer.launch(intent) }
        }
    }
    LaunchedEffect(state.readyApk) {
        state.readyApk?.let { file -> if (attemptedPath != file.path) { attemptedPath = file.path; install() } }
    }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, updater) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_START) updater.check() }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    if (permissionPrompt) AlertDialog(onDismissRequest = { permissionPrompt = false }, title = { Text("Autorizar atualização") }, text = { Text("Para instalar a nova versão, o Android pede que você autorize o Meu Saldo a instalar aplicativos. Depois, volte e confirme a atualização. Seus registros serão mantidos.") }, confirmButton = { TextButton(onClick = {
        permissionPrompt = false
        try { permission.launch(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))) }
        catch (_: Exception) { updater.message("Abra as configurações do Android e autorize instalar apps pelo Meu Saldo.") }
    }) { Text("Abrir configurações") } }, dismissButton = { TextButton(onClick = { permissionPrompt = false }) { Text("Agora não") } })
    return install
}

private fun openInstaller(context: Context, file: File, updater: UpdateViewModel, launch: (Intent) -> Unit) {
    try {
        require(file.isFile) { "Arquivo da atualização não encontrado. Baixe novamente." }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        launch(intent)
    } catch (e: Exception) { updater.message(e.message ?: "Não foi possível abrir o instalador do Android.") }
}

@Composable fun UpdateBanner(updater: UpdateViewModel, install: () -> Unit, settings: Boolean = false) {
    val state by updater.state.collectAsStateWithLifecycle()
    if (!settings && (state.available == null || state.dismissed)) return
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFE5F0F2))) {
        Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(Icons.Default.SystemUpdate, null, tint = Teal)
                Text(if (state.available != null) "Nova versão ${state.available!!.versionName}" else "Atualizações", fontWeight = FontWeight.SemiBold, color = Navy)
            }
            Text("Versão instalada: ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodySmall)
            state.available?.let { release ->
                Text("A atualização mantém seus lançamentos e categorias neste celular.", style = MaterialTheme.typography.bodyMedium)
                if (release.notes.isNotBlank()) Text(release.notes, style = MaterialTheme.typography.bodySmall)
            }
            if (state.checking) { LinearProgressIndicator(Modifier.fillMaxWidth()); Text("Verificando…", style = MaterialTheme.typography.bodySmall) }
            if (state.downloading) {
                LinearProgressIndicator(progress = { state.progress }, modifier = Modifier.fillMaxWidth())
                Text("Baixando ${(state.progress * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)
                TextButton(onClick = updater::cancelDownload) { Text("Cancelar download") }
            } else {
                state.available?.let {
                    Button(onClick = { if (state.readyApk != null) install() else updater.download() }, enabled = !state.checking) { Text(if (state.readyApk != null) "Instalar atualização" else "Baixar e atualizar") }
                    if (!settings) TextButton(onClick = updater::dismissBanner) { Text("Agora não") }
                }
                if (settings) OutlinedButton(onClick = { updater.check(manual = true) }, enabled = !state.checking) { Text("Verificar atualizações") }
            }
            state.message?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (settings) Text("O app verifica novas versões ao abrir, no máximo a cada 6 horas. Sem conexão, continue usando normalmente.", style = MaterialTheme.typography.bodySmall)
        }
    }
}
