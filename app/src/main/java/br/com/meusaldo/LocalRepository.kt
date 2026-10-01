package br.com.meusaldo

import android.util.AtomicFile
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

interface LedgerStorage { fun read(): String?; fun write(text: String) }
class AtomicLedgerStorage(file: File): LedgerStorage {
    private val atomic = AtomicFile(file)
    override fun read(): String? = try { atomic.openRead().bufferedReader(Charsets.UTF_8).use { it.readText() } } catch (e: java.io.FileNotFoundException) {
        if (atomic.baseFile.exists()) throw e else null
    }
    override fun write(text: String) {
        val stream = atomic.startWrite()
        try { stream.write(text.toByteArray(Charsets.UTF_8)); atomic.finishWrite(stream) }
        catch (e: Exception) { atomic.failWrite(stream); throw e }
    }
}
class LocalRepository(private val storage: LedgerStorage) {
    private val mutex = Mutex()
    private var current: Ledger? = null
    suspend fun load(): Ledger = withContext(Dispatchers.IO) { mutex.withLock {
        (storage.read()?.let(::decode) ?: Ledger()).also { current = it }
    } }
    suspend fun update(change: (Ledger) -> Ledger): Ledger = withContext(Dispatchers.IO) { mutex.withLock {
        val next = validate(change(requireNotNull(current) { "Dados não carregados. Restaure um backup ou tente novamente." }))
        storage.write(encode(next)); current = next; next
    } }
    suspend fun restore(data: Ledger): Ledger = withContext(Dispatchers.IO) { mutex.withLock {
        validate(data); storage.write(encode(data)); current = data; data
    } }
}
