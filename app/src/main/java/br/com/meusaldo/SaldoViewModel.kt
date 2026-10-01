package br.com.meusaldo

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

data class UiState(val ledger: Ledger? = null, val busy: Boolean = true, val error: String? = null)
class SaldoViewModel(application: Application): AndroidViewModel(application) {
    private val repository = LocalRepository(AtomicLedgerStorage(File(application.filesDir, "saldo.json")))
    private val mutable = MutableStateFlow(UiState())
    val state = mutable.asStateFlow()
    init { reload() }
    fun reload() = operation { repository.load() }
    fun change(change: (Ledger) -> Ledger, onSuccess: () -> Unit = {}) = operation(onSuccess) { repository.update(change) }
    fun restore(data: Ledger) = operation { repository.restore(data) }
    fun dismissError() { mutable.value = mutable.value.copy(error = null) }
    fun error(message: String) { mutable.value = mutable.value.copy(error = message) }
    private fun operation(onSuccess: () -> Unit = {}, action: suspend () -> Ledger) {
        if (mutable.value.busy && mutable.value.ledger != null) return
        mutable.value = mutable.value.copy(busy = true)
        viewModelScope.launch {
            try { mutable.value = UiState(ledger = action(), busy = false); onSuccess() }
            catch (e: Exception) { mutable.value = mutable.value.copy(busy = false, error = e.message ?: "Não foi possível salvar. Os dados anteriores foram preservados.") }
        }
    }
}
