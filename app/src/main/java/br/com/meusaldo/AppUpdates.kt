package br.com.meusaldo

import android.app.Application
import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.MessageDigest
import javax.net.ssl.HttpsURLConnection
import kotlin.coroutines.coroutineContext

@Serializable data class AppRelease(
    val versionCode: Long,
    val versionName: String,
    val apkUrl: String,
    val sha256: String,
    val sizeBytes: Long,
    val minSdk: Int = 26,
    val notes: String = ""
)

private val releaseJson = Json { ignoreUnknownKeys = true }
fun parseRelease(text: String): AppRelease = releaseJson.decodeFromString<AppRelease>(text).also { release ->
    require(release.versionCode > 0 && release.versionName.matches(Regex("[0-9]+\\.[0-9]+\\.[0-9]+"))) { "Versão de atualização inválida." }
    val uri = URI(release.apkUrl)
    require(uri.scheme == "https" && uri.host == "github.com" && uri.userInfo == null && uri.rawQuery == null && uri.rawFragment == null && uri.path == "/e-Lopes/meu-saldo/releases/download/v${release.versionName}/meu-saldo.apk") { "Endereço de atualização inválido." }
    require(release.sha256.matches(Regex("[a-fA-F0-9]{64}")) && release.sizeBytes in 1..100_000_000 && release.minSdk >= 26 && release.notes.length <= 10_000) { "Informações de atualização inválidas." }
}

data class UpdateState(
    val checking: Boolean = false,
    val downloading: Boolean = false,
    val progress: Float = 0f,
    val available: AppRelease? = null,
    val readyApk: File? = null,
    val dismissed: Boolean = false,
    val message: String? = null
)

class UpdateViewModel(application: Application): AndroidViewModel(application) {
    private val prefs = application.getSharedPreferences("app_updates", Context.MODE_PRIVATE)
    private val mutable = MutableStateFlow(UpdateState())
    val state = mutable.asStateFlow()
    private var downloadJob: Job? = null
    init {
        val cached = runCatching { parseRelease(prefs.getString("release", null) ?: "") }.getOrNull()
        if (cached != null && cached.versionCode > BuildConfig.VERSION_CODE && cached.minSdk <= Build.VERSION.SDK_INT) mutable.update { it.copy(available = cached) }
    }

    fun check(manual: Boolean = false) {
        if (mutable.value.checking || mutable.value.downloading) return
        val now = System.currentTimeMillis()
        val last = prefs.getLong("lastAutomaticAttempt", 0)
        if (!manual && now >= last && now - last < 6 * 60 * 60 * 1000L) return
        prefs.edit().putLong("lastAutomaticAttempt", now).apply()
        mutable.update { it.copy(checking = true, message = null) }
        viewModelScope.launch {
            try {
                val release = withContext(Dispatchers.IO) {
                    openSecure(BuildConfig.UPDATE_URL).let { connection ->
                        try {
                            if (connection.responseCode == HttpURLConnection.HTTP_NOT_FOUND) null
                            else {
                                require(connection.responseCode == HttpURLConnection.HTTP_OK) { "Atualizações indisponíveis no momento." }
                                connection.inputStream.use { input ->
                                    val bytes = java.io.ByteArrayOutputStream(); val buffer = ByteArray(4096)
                                    var count = input.read(buffer)
                                    while (count != -1) {
                                        coroutineContext.ensureActive(); require(bytes.size() + count <= 65536) { "Arquivo de versão inválido." }
                                        bytes.write(buffer, 0, count); count = input.read(buffer)
                                    }
                                    parseRelease(bytes.toString("UTF-8"))
                                }
                            }
                        } finally { connection.disconnect() }
                    }
                }
                val compatible = release?.takeIf { it.versionCode > BuildConfig.VERSION_CODE && it.minSdk <= Build.VERSION.SDK_INT }
                prefs.edit().apply {
                    if (compatible == null) remove("release") else putString("release", releaseJson.encodeToString(AppRelease.serializer(), compatible))
                }.apply()
                mutable.update { it.copy(checking = false, available = compatible, readyApk = if (it.available == compatible) it.readyApk else null, dismissed = if (it.available == compatible) it.dismissed else false, message = if (compatible != null) "Versão ${compatible.versionName} disponível" else if (release != null && release.versionCode > BuildConfig.VERSION_CODE) "Uma versão mais recente exige um Android mais novo." else "Você está na versão mais recente.") }
            } catch (e: CancellationException) { throw e }
            catch (_: Exception) { mutable.update { it.copy(checking = false, message = "Não foi possível verificar agora. Você pode continuar usando o app offline.") } }
        }
    }

    fun dismissBanner() { mutable.update { it.copy(dismissed = true) } }
    fun message(text: String) { mutable.update { it.copy(message = text) } }

    fun download() {
        val release = mutable.value.available ?: return
        if (mutable.value.downloading || mutable.value.checking) return
        mutable.update { it.copy(downloading = true, progress = 0f, readyApk = null, message = null, dismissed = false) }
        downloadJob = viewModelScope.launch {
            try {
                val file = withContext(Dispatchers.IO) { downloadApk(getApplication(), release) { value -> mutable.update { it.copy(progress = value) } } }
                mutable.update { it.copy(downloading = false, readyApk = file, message = "Download concluído. Confirme a atualização no Android.") }
            } catch (e: CancellationException) { mutable.update { it.copy(downloading = false, message = "Download cancelado.") }; throw e }
            catch (e: Exception) { mutable.update { it.copy(downloading = false, readyApk = null, message = e.message ?: "Não foi possível baixar. Tente novamente com conexão.") } }
        }
    }
    fun cancelDownload() { downloadJob?.cancel() }
}

private fun openSecure(address: String): HttpsURLConnection {
    var url = URL(address)
    repeat(6) {
        require(url.protocol == "https" && url.host in setOf("github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com")) { "Servidor de atualização inválido." }
        val connection = (url.openConnection() as HttpsURLConnection).apply {
            instanceFollowRedirects = false; connectTimeout = 10_000; readTimeout = 20_000; useCaches = false
            setRequestProperty("User-Agent", "MeuSaldo/${BuildConfig.VERSION_NAME}")
            setRequestProperty("Cache-Control", "no-cache")
            setRequestProperty("Accept-Encoding", "identity")
        }
        try {
            if (connection.responseCode in listOf(301, 302, 303, 307, 308)) {
                val location = connection.getHeaderField("Location") ?: error("Redirecionamento inválido.")
                url = URL(url, location); connection.disconnect()
            } else return connection
        } catch (e: Exception) { connection.disconnect(); throw e }
    }
    error("Redirecionamentos demais ao buscar atualização.")
}

private suspend fun downloadApk(context: Context, release: AppRelease, progress: (Float) -> Unit): File {
    val directory = File(context.cacheDir, "updates").apply { require(isDirectory || mkdirs()) { "Não há espaço para baixar a atualização." } }
    val complete = File(directory, "update-${release.versionCode}.apk")
    if (complete.exists() && runCatching { verifyApk(context, complete, release) }.isSuccess) return complete
    val partial = File(directory, "update-${release.versionCode}.download.apk")
    try {
        val connection = openSecure(release.apkUrl)
        try {
            require(connection.responseCode == HttpURLConnection.HTTP_OK) { "Falha ao baixar a atualização. Tente novamente." }
            connection.inputStream.use { input -> FileOutputStream(partial).use { output ->
                val buffer = ByteArray(65536); var received = 0L; var count = input.read(buffer)
                while (count != -1) {
                    coroutineContext.ensureActive(); received += count
                    require(received <= release.sizeBytes) { "Tamanho de atualização inválido." }
                    output.write(buffer, 0, count); progress(received.toFloat() / release.sizeBytes); count = input.read(buffer)
                }
                output.fd.sync()
            } }
        } finally { connection.disconnect() }
        verifyApk(context, partial, release)
        require(partial.renameTo(complete)) { "Não foi possível preparar o APK." }
        return complete
    } catch (e: CancellationException) { throw e }
    catch (e: java.io.IOException) { throw java.io.IOException("Download interrompido. Verifique a conexão e o espaço disponível.", e) }
    finally { partial.delete() }
}

@Suppress("DEPRECATION") private fun verifyApk(context: Context, file: File, release: AppRelease) {
    require(file.length() == release.sizeBytes) { "Download incompleto. Tente novamente." }
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input -> val buffer = ByteArray(65536); var count = input.read(buffer); while (count != -1) { digest.update(buffer, 0, count); count = input.read(buffer) } }
    val hash = digest.digest().joinToString("") { "%02x".format(it.toInt() and 255) }
    require(hash.equals(release.sha256, ignoreCase = true)) { "A atualização falhou na verificação de integridade." }
    val flags = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
    val candidate = context.packageManager.getPackageArchiveInfo(file.absolutePath, flags) ?: error("APK inválido.")
    val installed = context.packageManager.getPackageInfo(context.packageName, flags)
    require(candidate.packageName == context.packageName && candidate.versionName == release.versionName) { "APK de outro aplicativo ou versão." }
    val code = if (Build.VERSION.SDK_INT >= 28) candidate.longVersionCode else candidate.versionCode.toLong()
    require(code == release.versionCode && code > BuildConfig.VERSION_CODE) { "Versão de APK incompatível." }
    fun signatures(info: PackageInfo): Set<String> = (if (Build.VERSION.SDK_INT >= 28) info.signingInfo?.apkContentsSigners else info.signatures)?.map { it.toCharsString() }?.toSet() ?: emptySet()
    val expected = signatures(installed)
    require(expected.isNotEmpty() && signatures(candidate) == expected) { "Assinatura diferente. Atualização recusada para proteger seus dados." }
}
