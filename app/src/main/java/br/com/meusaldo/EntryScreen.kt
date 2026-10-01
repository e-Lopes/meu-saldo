package br.com.meusaldo

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID

@Composable fun FullEntryEditor(original: Entry?, data: Ledger, month: YearMonth, busy: Boolean, onDismiss: () -> Unit, onSave: (Entry) -> Unit, onDelete: (Entry) -> Unit) {
    val context = LocalContext.current
    var kind by rememberSaveable { mutableStateOf(original?.kind ?: Kind.DESPESA) }
    var value by rememberSaveable { mutableStateOf(original?.let { BigDecimal.valueOf(it.cents, 2).toPlainString().replace('.', ',') } ?: "") }
    var date by rememberSaveable { mutableStateOf(original?.date ?: if (month == YearMonth.now()) LocalDate.now().toString() else month.atDay(1).toString()) }
    var description by rememberSaveable { mutableStateOf(original?.description ?: "") }
    var category by rememberSaveable { mutableStateOf(original?.categoryId) }
    var valueError by remember { mutableStateOf<String?>(null) }
    var categoryError by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var deleting by remember { mutableStateOf(false) }
    val choices = data.categories.filter { !it.archived || it.id == original?.categoryId }

    Dialog(onDismissRequest = { if (!busy) onDismiss() }, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.fillMaxSize().systemBarsPadding().imePadding()) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onDismiss, enabled = !busy) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Cancelar lançamento") }
                    Text(if (original == null) "Novo lançamento" else "Editar lançamento", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Navy)
                }
                if (busy) LinearProgressIndicator(Modifier.fillMaxWidth())
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Kind.entries.forEach { type ->
                            val selected = kind == type
                            val tint = if (type == Kind.RECEITA) Teal else Color(0xFFB94B54)
                            Surface(onClick = { kind = type; categoryError = false }, enabled = !busy, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp), color = if (selected) tint.copy(alpha = .12f) else Color.White, border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, tint) else null) {
                                Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                                    Icon(if (type == Kind.RECEITA) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward, null, tint = tint, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(6.dp)); Text(if (type == Kind.RECEITA) "Receita" else "Despesa", fontWeight = FontWeight.SemiBold, color = if (selected) tint else Navy)
                                }
                            }
                        }
                    }
                    OutlinedTextField(value, { value = it; valueError = null }, modifier = Modifier.fillMaxWidth(), enabled = !busy, label = { Text("Valor") }, prefix = { Text("R$ ") }, placeholder = { Text("0,00") }, textStyle = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), singleLine = true, isError = valueError != null, supportingText = { valueError?.let { Text(it) } })
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Categoria${if (kind == Kind.RECEITA) " (opcional)" else ""}", style = MaterialTheme.typography.titleSmall, color = Navy)
                        if (kind == Kind.RECEITA && category != null) TextButton(onClick = { category = null }, enabled = !busy) { Text("Usar sem categoria") }
                        if (choices.isEmpty()) Text("Crie uma categoria no Menu antes de adicionar uma despesa.", style = MaterialTheme.typography.bodyMedium)
                        BoxWithConstraints {
                            val columns = if (maxWidth < 330.dp || LocalDensity.current.fontScale > 1.25f) 2 else 3
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                choices.chunked(columns).forEach { row -> Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    row.forEach { c ->
                                        val selected = category == c.id
                                        Surface(onClick = { category = c.id; categoryError = false }, enabled = !busy, modifier = Modifier.weight(1f), shape = RoundedCornerShape(16.dp), color = if (selected) Color(c.color).copy(alpha = .13f) else Color.White, border = if (selected) androidx.compose.foundation.BorderStroke(2.dp, Color(c.color)) else null) {
                                            Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Icon(categoryImage(c.icon), null, tint = Color(c.color), modifier = Modifier.size(24.dp))
                                                Text(c.name + if (c.archived) " (arquivada)" else "", style = MaterialTheme.typography.labelMedium, maxLines = 3, color = Navy)
                                                if (selected) Icon(Icons.Default.CheckCircle, "Categoria selecionada", tint = Teal, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    }
                                    repeat(columns - row.size) { Spacer(Modifier.weight(1f)) }
                                } }
                            }
                        }
                        if (categoryError) Text("Escolha uma categoria para a despesa.", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    Card(onClick = {
                        val selected = LocalDate.parse(date)
                        DatePickerDialog(context, { _, year, m, day -> date = LocalDate.of(year, m + 1, day).toString() }, selected.year, selected.monthValue - 1, selected.dayOfMonth).show()
                    }, enabled = !busy, colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Icon(Icons.Default.CalendarMonth, null, tint = Teal)
                            Column(Modifier.weight(1f)) {
                                Text("Data", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(LocalDate.parse(date).format(DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR"))), style = MaterialTheme.typography.bodyLarge)
                            }
                            Icon(Icons.Default.ChevronRight, "Escolher data", tint = Navy)
                        }
                    }
                    OutlinedTextField(description, { description = it.take(300) }, label = { Text("Descrição (opcional)") }, placeholder = { Text("Ex.: almoço, salário, mercado") }, modifier = Modifier.fillMaxWidth(), enabled = !busy, maxLines = 3)
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    if (original != null) TextButton(onClick = { deleting = true }, enabled = !busy) { Icon(Icons.Default.DeleteOutline, null); Spacer(Modifier.width(8.dp)); Text("Excluir lançamento") }
                }
                Surface(shadowElevation = 4.dp, color = Color.White) {
                    Button(onClick = {
                        valueError = null; categoryError = kind == Kind.DESPESA && category == null; error = null
                        val cents = try { parseCents(value) } catch (e: Exception) { valueError = e.message ?: "Informe um valor válido."; null }
                        if (cents != null && !categoryError) {
                            try {
                                val entry = Entry(original?.id ?: UUID.randomUUID().toString(), kind, cents, date, category, description.trim())
                                validate(data.copy(entries = data.entries.filterNot { it.id == entry.id } + entry)); onSave(entry)
                            } catch (e: Exception) { error = e.message ?: "Verifique os campos." }
                        }
                    }, enabled = !busy, modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp).heightIn(min = 54.dp), shape = RoundedCornerShape(16.dp)) {
                        Text(if (busy) "Salvando…" else if (original == null) "Adicionar ${if (kind == Kind.RECEITA) "receita" else "despesa"}" else "Salvar alterações", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
    if (deleting && original != null) AlertDialog(onDismissRequest = { if (!busy) deleting = false }, title = { Text("Excluir lançamento?") }, text = { Text("${money(original.cents)} será removido do histórico.") }, confirmButton = { TextButton(onClick = { onDelete(original); deleting = false }, enabled = !busy) { Text("Excluir", color = MaterialTheme.colorScheme.error) } }, dismissButton = { TextButton(onClick = { deleting = false }) { Text("Cancelar") } })
}
