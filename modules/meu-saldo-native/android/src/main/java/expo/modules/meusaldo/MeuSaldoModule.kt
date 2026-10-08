package expo.modules.meusaldo

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.provider.DocumentsContract
import android.util.AtomicFile
import androidx.core.content.FileProvider
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.Executors

private const val MAX_BYTES = 10 * 1024 * 1024
private const val EXPORT_REQUEST = 47031
private const val IMPORT_REQUEST = 47032
private const val FOLDER_REQUEST = 47033
class UpdateFileProvider : FileProvider()

class MeuSaldoModule : Module() {
  private val storageLock = Any()
  private val backupWorker = Executors.newSingleThreadExecutor()
  private var pickerPromise: Promise? = null
  private var exportText: String? = null
  private val context get() = requireNotNull(appContext.reactContext) { "Aplicativo indisponível." }
  private val updates by lazy { LocalUpdates(context) }
  private fun ledgerFile() = AtomicFile(File(context.filesDir, "saldo.json"))
  private val preferences get() = context.getSharedPreferences("app_preferences", android.content.Context.MODE_PRIVATE)

  override fun definition() = ModuleDefinition {
    Name("MeuSaldoNative")
    Events("updateProgress")
    Constant("versionName") { context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "" }
    AsyncFunction("getPreferences") {
      applyTheme()
      mapOf("lastBackup" to preferences.getLong("lastBackup", 0), "backgroundBackup" to preferences.getBoolean("backgroundBackup", false), "reminderAfter" to preferences.getLong("reminderAfter", 0))
    }
    AsyncFunction("chooseBackupFolder") { promise: Promise ->
      startPicker(promise, null, Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
      }, FOLDER_REQUEST)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("disableBackgroundBackup") {
      require(preferences.edit().putBoolean("backgroundBackup", false).commit()) { "Não foi possível desativar o backup automático." }
    }
    AsyncFunction("postponeBackup") {
      require(preferences.edit().putLong("reminderAfter", System.currentTimeMillis() + 7L * 86400000L).commit()) { "Não foi possível adiar o lembrete." }
    }
    AsyncFunction("backgroundBackup") Coroutine { text: String -> withContext(Dispatchers.IO) {
      val bytes = text.toByteArray(Charsets.UTF_8)
      require(bytes.size <= MAX_BYTES) { "Backup maior que 10 MB." }
      require(preferences.getBoolean("backgroundBackup", false)) { "Autorize uma pasta nos Ajustes antes de usar backup automático." }
      val tree = Uri.parse(requireNotNull(preferences.getString("backupFolder", null)))
      val root = DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree))
      val uri = DocumentsContract.createDocument(context.contentResolver, root, "application/json", "meu-saldo-${System.currentTimeMillis()}.json") ?: error("Não foi possível criar o arquivo na pasta escolhida.")
      try {
        context.contentResolver.openOutputStream(uri, "wt")?.use { it.write(bytes) } ?: error("Não foi possível abrir o destino do backup.")
        val stored = context.contentResolver.openInputStream(uri)?.use { readLimited(it) } ?: error("Não foi possível conferir o backup salvo.")
        require(stored == text) { "O arquivo de backup não foi gravado corretamente." }
      } catch (e: Exception) { runCatching { DocumentsContract.deleteDocument(context.contentResolver, uri) }; throw e }
      require(preferences.edit().putLong("lastBackup", System.currentTimeMillis()).putLong("reminderAfter", 0).commit()) { "A cópia foi salva, mas não foi possível registrar a data da exportação." }
      true
    } }
    AsyncFunction("readLedger") {
      synchronized(storageLock) {
        val atomic = ledgerFile()
        // AtomicFile.openRead recovers the original .bak after an interrupted write.
        if (!atomic.baseFile.exists() && !File(atomic.baseFile.path + ".bak").exists()) null
        else atomic.openRead().use { input -> readLimited(input) }
      }
    }
    AsyncFunction("writeLedger") { text: String ->
      val bytes = text.toByteArray(Charsets.UTF_8)
      require(bytes.size <= MAX_BYTES) { "Limite de 10 MB atingido. Nenhum registro foi alterado." }
      synchronized(storageLock) {
        val atomic = ledgerFile()
        val stream = atomic.startWrite()
        try { stream.write(bytes); stream.flush(); stream.fd.sync(); atomic.finishWrite(stream) }
        catch (e: Exception) { atomic.failWrite(stream); throw java.io.IOException("A alteração não foi salva. Os registros anteriores foram preservados.", e) }
      }
    }
    AsyncFunction("exportBackup") { text: String, name: String, promise: Promise ->
      require(text.toByteArray(Charsets.UTF_8).size <= MAX_BYTES) { "Backup maior que 10 MB." }
      startPicker(promise, text, Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE); type = "application/json"; putExtra(Intent.EXTRA_TITLE, name)
      }, EXPORT_REQUEST)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("importBackup") { promise: Promise ->
      startPicker(promise, null, Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE); type = "*/*"
        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/plain", "application/octet-stream"))
      }, IMPORT_REQUEST)
    }.runOnQueue(Queues.MAIN)
    OnActivityResult { _, result ->
      if (result.requestCode == EXPORT_REQUEST || result.requestCode == IMPORT_REQUEST || result.requestCode == FOLDER_REQUEST) {
        val promise = pickerPromise
        val text = exportText
        pickerPromise = null; exportText = null
        if (promise != null) {
          val uri = result.data?.data
          if (result.resultCode != Activity.RESULT_OK || uri == null) promise.resolve(if (result.requestCode == IMPORT_REQUEST) null else false)
          else backupWorker.execute {
            try {
              if (result.requestCode == FOLDER_REQUEST) {
                val flags = (result.data?.flags ?: 0) and (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                require(flags and Intent.FLAG_GRANT_WRITE_URI_PERMISSION != 0) { "A pasta não autorizou gravação." }
                context.contentResolver.takePersistableUriPermission(uri, flags)
                require(preferences.edit().putString("backupFolder", uri.toString()).putBoolean("backgroundBackup", true).commit()) { "Não foi possível salvar a pasta de backup." }
                promise.resolve(true)
              } else if (result.requestCode == EXPORT_REQUEST) {
                context.contentResolver.openOutputStream(uri, "wt")?.use { it.write(requireNotNull(text).toByteArray(Charsets.UTF_8)) }
                  ?: error("Não foi possível abrir o destino do backup.")
                val previousBackup = preferences.getLong("lastBackup", 0)
                if (!preferences.edit().putLong("lastBackup", System.currentTimeMillis()).commit()) {
                  // A failed commit can still update SharedPreferences in memory.
                  preferences.edit().putLong("lastBackup", previousBackup).commit()
                  error("A cópia foi salva, mas não foi possível registrar a data da exportação.")
                }
                promise.resolve(true)
              } else {
                val imported = context.contentResolver.openInputStream(uri)?.use { readLimited(it) }
                  ?: error("Não foi possível abrir o backup.")
                promise.resolve(imported)
              }
            } catch (e: Exception) { promise.reject("BACKUP_ERROR", e.message ?: "Não foi possível concluir o backup.", e) }
          }
        }
      }
    }
    AsyncFunction("cachedUpdate") { updates.cached()?.asMap() }
    AsyncFunction("checkUpdate") Coroutine { manual: Boolean -> withContext(Dispatchers.IO) { updates.check(manual) } }
    AsyncFunction("downloadUpdate") Coroutine { text: String ->
      withContext(Dispatchers.IO) { updates.download(parseRelease(text)) { sendEvent("updateProgress", mapOf("progress" to it)) } }
    }
    Function("cancelDownload") { updates.cancel() }
    AsyncFunction("installUpdate") Coroutine { text: String ->
      val file = withContext(Dispatchers.IO) { updates.ready(parseRelease(text)) }
      withContext(Dispatchers.Main) {
        val activity = requireNotNull(appContext.currentActivity) { "Não foi possível abrir o instalador." }
        if (!context.packageManager.canRequestPackageInstalls()) "permission"
        else {
          val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", file)
          activity.startActivity(Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          })
          "installer"
        }
      }
    }
    AsyncFunction("openInstallPermission") {
      requireNotNull(appContext.currentActivity).startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")))
    }.runOnQueue(Queues.MAIN)
    OnDestroy {
      updates.cancel()
      pickerPromise?.reject("CANCELLED", "Seleção interrompida. Seus registros foram preservados.", null)
      pickerPromise = null; exportText = null
      backupWorker.shutdown()
    }
  }

  @Suppress("DEPRECATION")
  private fun applyTheme() {
    val activity = appContext.currentActivity as? AppCompatActivity ?: return
    activity.runOnUiThread { activity.delegate.localNightMode = AppCompatDelegate.MODE_NIGHT_YES }
  }

  @Suppress("DEPRECATION")
  private fun startPicker(promise: Promise, text: String?, intent: Intent, request: Int) {
    require(pickerPromise == null) { "Há uma seleção de arquivo em andamento." }
    val activity = requireNotNull(appContext.currentActivity) { "Seletor de arquivos indisponível." }
    pickerPromise = promise; exportText = text
    try { activity.startActivityForResult(intent, request) }
    catch (e: Exception) { pickerPromise = null; exportText = null; promise.reject("PICKER_ERROR", "Não foi possível abrir o seletor de arquivos.", e) }
  }
  private fun readLimited(input: java.io.InputStream): String {
    val output = ByteArrayOutputStream(); val buffer = ByteArray(8192)
    var count = input.read(buffer)
    while (count != -1) { require(output.size() + count <= MAX_BYTES) { "Arquivo maior que 10 MB." }; output.write(buffer, 0, count); count = input.read(buffer) }
    return Charsets.UTF_8.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.REPORT)
      .onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPORT)
      .decode(java.nio.ByteBuffer.wrap(output.toByteArray())).toString()
  }
}
