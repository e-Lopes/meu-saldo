package expo.modules.meusaldo

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.atomic.AtomicBoolean
import javax.net.ssl.HttpsURLConnection
import kotlin.coroutines.coroutineContext

data class AppRelease(val versionCode: Long, val versionName: String, val apkUrl: String,
  val sha256: String, val sizeBytes: Long, val minSdk: Int, val notes: String) {
  fun asMap(): Map<String, Any> = mapOf("versionCode" to versionCode, "versionName" to versionName,
    "apkUrl" to apkUrl, "sha256" to sha256, "sizeBytes" to sizeBytes, "minSdk" to minSdk, "notes" to notes)
  fun json() = JSONObject(asMap()).toString()
}
fun parseRelease(text: String): AppRelease {
  require(text.toByteArray().size <= 65536) { "Arquivo de versão inválido." }
  val data = JSONObject(text)
  val release = AppRelease(data.getLong("versionCode"), data.getString("versionName"), data.getString("apkUrl"),
    data.getString("sha256"), data.getLong("sizeBytes"), data.optInt("minSdk", 26), data.optString("notes", ""))
  require(release.versionCode > 0 && release.versionName.matches(Regex("[0-9]+\\.[0-9]+\\.[0-9]+"))) { "Versão de atualização inválida." }
  val uri = URI(release.apkUrl)
  require(uri.scheme == "https" && uri.host == "github.com" && uri.userInfo == null && uri.rawQuery == null && uri.rawFragment == null && uri.path == "/e-Lopes/meu-saldo/releases/download/v${release.versionName}/meu-saldo.apk") { "Endereço de atualização inválido." }
  require(release.sha256.matches(Regex("[a-fA-F0-9]{64}")) && release.sizeBytes in 1..100_000_000 && release.minSdk >= 26 && release.notes.length <= 10000) { "Informações de atualização inválidas." }
  return release
}

class LocalUpdates(private val context: Context) {
  private val prefs = context.getSharedPreferences("app_updates", Context.MODE_PRIVATE)
  private val cancelled = AtomicBoolean(false)
  private val downloadLock = Mutex()
  private val checkLock = Any()
  @Suppress("DEPRECATION") private fun versionCode(): Long {
    val info = context.packageManager.getPackageInfo(context.packageName, 0)
    return if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()
  }
  private fun compatible(release: AppRelease) = release.versionCode > versionCode() && release.minSdk <= Build.VERSION.SDK_INT
  fun cached(): AppRelease? = runCatching { parseRelease(prefs.getString("release", null) ?: "") }.getOrNull()?.takeIf(::compatible)
  fun check(manual: Boolean): Map<String, Any?> = synchronized(checkLock) {
    val now = System.currentTimeMillis(); val last = prefs.getLong("lastAutomaticAttempt", 0)
    if (!manual && now >= last && now - last < 6 * 60 * 60 * 1000L) return@synchronized mapOf("release" to cached()?.asMap(), "message" to "")
    prefs.edit().putLong("lastAutomaticAttempt", now).apply()
    val connection = openSecure("https://github.com/e-Lopes/meu-saldo/releases/latest/download/update.json")
    val release = try {
      if (connection.responseCode == 404) null
      else {
        require(connection.responseCode == 200) { "Atualizações indisponíveis no momento." }
        connection.inputStream.use { input ->
          val output = ByteArrayOutputStream(); val buffer = ByteArray(4096); var count = input.read(buffer)
          while (count != -1) { require(output.size() + count <= 65536) { "Arquivo de versão inválido." }; output.write(buffer, 0, count); count = input.read(buffer) }
          parseRelease(output.toString("UTF-8"))
        }
      }
    } finally { connection.disconnect() }
    val available = release?.takeIf(::compatible)
    prefs.edit().apply { if (available == null) remove("release") else putString("release", available.json()) }.apply()
    mapOf("release" to available?.asMap(), "message" to if (available != null) "Versão ${available.versionName} disponível."
      else if (release != null && release.versionCode > versionCode()) "Uma versão mais recente exige um Android mais novo."
      else "Você está na versão mais recente.")
  }
  fun cancel() { cancelled.set(true) }
  private fun complete(release: AppRelease) = File(context.cacheDir, "updates/update-${release.versionCode}.apk")
  fun ready(release: AppRelease): File = complete(release).also {
    require(it.isFile) { "Arquivo da atualização não encontrado. Baixe novamente." }; verifyApk(it, release)
  }
  suspend fun download(release: AppRelease, progress: (Float) -> Unit) = downloadLock.withLock {
    require(compatible(release)) { "Versão incompatível." }
    cancelled.set(false)
    val complete = complete(release)
    require(complete.parentFile!!.isDirectory || complete.parentFile!!.mkdirs()) { "Não há espaço para baixar a atualização." }
    if (complete.exists() && runCatching { verifyApk(complete, release) }.isSuccess) { progress(1f); return@withLock }
    val partial = File(complete.parentFile, "update-${release.versionCode}.download.apk")
    try {
      val connection = openSecure(release.apkUrl)
      try {
        require(connection.responseCode == 200) { "Falha ao baixar a atualização. Tente novamente." }
        connection.inputStream.use { input -> FileOutputStream(partial).use { output ->
          val buffer = ByteArray(65536); var received = 0L; var count = input.read(buffer); var lastProgress = -1
          while (count != -1) {
            coroutineContext.ensureActive(); require(!cancelled.get()) { "Download cancelado." }
            received += count; require(received <= release.sizeBytes) { "Tamanho da atualização inválido." }
            output.write(buffer, 0, count)
            val percent = (received * 100 / release.sizeBytes).toInt()
            if (percent != lastProgress) { lastProgress = percent; progress(received.toFloat() / release.sizeBytes) }
            count = input.read(buffer)
          }
          output.fd.sync()
        } }
      } finally { connection.disconnect() }
      coroutineContext.ensureActive(); require(!cancelled.get()) { "Download cancelado." }
      verifyApk(partial, release)
      require(partial.renameTo(complete)) { "Não foi possível preparar o APK." }
    } finally { partial.delete() }
  }
  private fun openSecure(address: String): HttpsURLConnection {
    var url = URL(address)
    repeat(6) {
      require(url.protocol == "https" && url.host in setOf("github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com")) { "Servidor de atualização inválido." }
      val connection = (url.openConnection() as HttpsURLConnection).apply {
        instanceFollowRedirects = false; connectTimeout = 10000; readTimeout = 20000; useCaches = false
        setRequestProperty("User-Agent", "MeuSaldo/${context.packageManager.getPackageInfo(context.packageName, 0).versionName}")
        setRequestProperty("Cache-Control", "no-cache"); setRequestProperty("Accept-Encoding", "identity")
      }
      try {
        if (connection.responseCode in listOf(301, 302, 303, 307, 308)) {
          url = URL(url, connection.getHeaderField("Location") ?: error("Redirecionamento inválido.")); connection.disconnect()
        } else return connection
      } catch (e: Exception) { connection.disconnect(); throw e }
    }
    error("Redirecionamentos demais ao buscar atualização.")
  }
  @Suppress("DEPRECATION") private fun verifyApk(file: File, release: AppRelease) {
    require(file.length() == release.sizeBytes) { "Download incompleto. Tente novamente." }
    val digest = MessageDigest.getInstance("SHA-256")
    file.inputStream().use { input -> val buffer = ByteArray(65536); var count = input.read(buffer); while (count != -1) { digest.update(buffer, 0, count); count = input.read(buffer) } }
    require(digest.digest().joinToString("") { "%02x".format(it.toInt() and 255) }.equals(release.sha256, true)) { "A atualização falhou na verificação de integridade." }
    val flags = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
    val candidate = context.packageManager.getPackageArchiveInfo(file.absolutePath, flags) ?: error("APK inválido.")
    val installed = context.packageManager.getPackageInfo(context.packageName, flags)
    require(candidate.packageName == context.packageName && candidate.versionName == release.versionName) { "APK de outro aplicativo ou versão." }
    val code = if (Build.VERSION.SDK_INT >= 28) candidate.longVersionCode else candidate.versionCode.toLong()
    require(code == release.versionCode && code > versionCode()) { "Versão de APK incompatível." }
    fun signatures(info: PackageInfo) = (if (Build.VERSION.SDK_INT >= 28) info.signingInfo?.apkContentsSigners else info.signatures)?.map { it.toCharsString() }?.toSet() ?: emptySet()
    val expected = signatures(installed)
    require(expected.isNotEmpty() && signatures(candidate) == expected) { "Assinatura diferente. Atualização recusada para proteger seus dados." }
  }
}
