package br.com.meusaldo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID
import androidx.compose.ui.platform.LocalContext

val Navy = Color(0xFF17304F)
val Teal = Color(0xFF378F8D)
class MainActivity: ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState); enableEdgeToEdge()
        setContent { MaterialTheme(colorScheme = lightColorScheme(primary = Teal, secondary = Navy, background = Color(0xFFF2F6FA), surface = Color.White, surfaceVariant = Color(0xFFE8F0F2)), shapes = Shapes(small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp), medium = androidx.compose.foundation.shape.RoundedCornerShape(20.dp), large = androidx.compose.foundation.shape.RoundedCornerShape(24.dp))) { SaldoApp() } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun SaldoApp(vm: SaldoViewModel = viewModel(), updater: UpdateViewModel = viewModel()) {
    val installUpdate = rememberUpdateInstaller(updater)
    val state by vm.state.collectAsStateWithLifecycle()
    val data = state.ledger
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var monthText by rememberSaveable { mutableStateOf(YearMonth.now().toString()) }
    val month = YearMonth.parse(monthText)
    var editorId by rememberSaveable { mutableStateOf<String?>(null) }
    val editor = data?.entries?.find { it.id == editorId }
    var adding by rememberSaveable { mutableStateOf(false) }
    var categories by rememberSaveable { mutableStateOf(false) }
    var historyCategory by rememberSaveable { mutableStateOf<String?>(null) }
    var pending by remember { mutableStateOf<Ledger?>(null) }
    var backupBusy by remember { mutableStateOf(false) }
    val contentScroll = remember(tab, categories) { androidx.compose.foundation.ScrollState(0) }
    BackHandler(enabled = categories && !adding) { categories = false }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }
    val export = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        if (uri != null && data != null) scope.launch {
            backupBusy = true
            try {
                withContext(Dispatchers.IO) { context.contentResolver.openOutputStream(uri, "wt")?.use { it.write(encode(data).toByteArray(Charsets.UTF_8)) } ?: error("Arquivo indisponível.") }
                snackbar.showSnackbar("Backup exportado.")
            } catch (e: Exception) { vm.error("Falha ao exportar: ${e.message}") }
            finally { backupBusy = false }
        }
    }
    val import = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) scope.launch {
            backupBusy = true
            try { pending = withContext(Dispatchers.IO) {
                context.contentResolver.openInputStream(uri)?.use { input ->
                    val output = java.io.ByteArrayOutputStream()
                    val buffer = ByteArray(8192)
                    var count = input.read(buffer)
                    while (count != -1) {
                        require(output.size() + count <= MAX_BACKUP_BYTES) { "Backup excede 10 MB." }
                        output.write(buffer, 0, count); count = input.read(buffer)
                    }
                    decode(output.toString("UTF-8"))
                } ?: error("Arquivo indisponível.")
            } } catch (e: Exception) { vm.error("Backup inválido: ${e.message}") }
            finally { backupBusy = false }
        }
    }
    Scaffold(snackbarHost = { SnackbarHost(snackbar) }, topBar = {
        AppHeader(month, categories, onPrevious = { monthText = month.minusMonths(1).toString() }, onNext = { monthText = month.plusMonths(1).toString() }, onToday = { monthText = YearMonth.now().toString() }, onBack = { categories = false })
    }, bottomBar = {
        AppNavigation(tab, data != null && !state.busy, onTab = { tab = it; categories = false; historyCategory = null }, onAdd = { editorId = null; adding = true })
    }) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().verticalScroll(contentScroll).padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            if (tab != 4) UpdateBanner(updater, installUpdate)
            if (state.busy || backupBusy) LinearProgressIndicator(Modifier.fillMaxWidth())
            if (data == null) {
                Text("Seus dados ficam somente neste celular. Se houve falha na leitura, o arquivo original foi preservado.")
                Button(onClick = { vm.reload() }, enabled = !state.busy) { Text("Tentar carregar") }
                OutlinedButton(onClick = { import.launch(arrayOf("application/json", "text/plain", "application/octet-stream")) }, enabled = !backupBusy) { Text("Restaurar backup") }
            } else when {
                categories -> Categories(data, vm)
                tab == 0 -> HomeDashboard(data, month, onAdd = { editorId = null; adding = true }, onCategory = { historyCategory = it; tab = 3 })
                tab == 1 -> { Pareto(data.groups(month)); Text("Últimos seis meses", style = MaterialTheme.typography.titleLarge)
                    Comparison(data, month)
                }
                tab == 3 -> History(data, month, historyCategory) { editorId = it.id; adding = true }
                tab == 4 -> {
                    UpdateBanner(updater, installUpdate, settings = true)
                    SettingsPanel(!state.busy && !backupBusy, onCategories = { categories = true }, onExport = { export.launch("meu-saldo-${LocalDate.now()}.json") }, onImport = { import.launch(arrayOf("application/json", "text/plain", "application/octet-stream")) })
                }
            }
        }
    }
    if (adding && data != null) FullEntryEditor(editor, data, month, state.busy, onDismiss = { adding = false }, onSave = { entry -> vm.change({ it.copy(entries = it.entries.filterNot { row -> row.id == entry.id } + entry) }) { adding = false; scope.launch { snackbar.showSnackbar(if (editor == null) "Lançamento adicionado" else "Lançamento atualizado") } } }, onDelete = { entry -> vm.change({ it.copy(entries = it.entries.filterNot { row -> row.id == entry.id }) }) { adding = false; scope.launch { snackbar.showSnackbar("Lançamento excluído") } } })
    pending?.let { imported -> AlertDialog(onDismissRequest = { pending = null }, title = { Text("Substituir os dados locais?") }, text = { Text("Backup com ${imported.entries.size} lançamentos e ${imported.categories.size} categorias. Todos os dados atuais serão substituídos. Exporte um backup antes de continuar.") }, confirmButton = { TextButton(onClick = { vm.restore(imported); pending = null }, enabled = !state.busy) { Text("Substituir") } }, dismissButton = { TextButton(onClick = { pending = null }) { Text("Cancelar") } }) }
    state.error?.let { AlertDialog(onDismissRequest = vm::dismissError, title = { Text("Não foi possível concluir") }, text = { Text(it) }, confirmButton = { TextButton(onClick = vm::dismissError) { Text("Entendi") } }) }
}

@Composable fun Pareto(groups: List<Group>) { ExpenseChart(groups) }

@Composable fun Comparison(data: Ledger, end: YearMonth) { MonthlyComparison(data, end) }

@Composable fun History(data: Ledger, month: YearMonth, initialCategory: String? = null, edit: (Entry) -> Unit) {
    var search by rememberSaveable { mutableStateOf("") }; var kind by rememberSaveable { mutableStateOf<Kind?>(null) }; var category by rememberSaveable(initialCategory) { mutableStateOf(initialCategory) }
    Text("Transações", style = MaterialTheme.typography.titleLarge)
    OutlinedTextField(search, { search = it }, label = { Text("Buscar descrição") }, modifier = Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf(null to "Todos", Kind.RECEITA to "Receitas", Kind.DESPESA to "Despesas").forEach { (id, label) -> FilterChip(selected = kind == id, onClick = { kind = id }, label = { Text(label) }) } }
    Choice("Categoria", listOf(null to "Todas") + data.categories.map { it.id to it.name }, category) { category = it }
    val entries = data.month(month).filter { (kind == null || it.kind == kind) && (category == null || it.categoryId == category) && it.description.contains(search, true) }.sortedByDescending { it.date }
    Text("${entries.size} lançamentos", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelLarge)
    if (entries.isEmpty()) EmptyPanel("Nenhum lançamento encontrado", "Adicione um lançamento ou ajuste os filtros.")
    entries.groupBy { it.date }.forEach { (date, rows) ->
        Text(LocalDate.parse(date).format(DateTimeFormatter.ofPattern("dd 'de' MMMM", Locale.forLanguageTag("pt-BR"))), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        rows.forEach { entry -> TransactionRow(entry, data.categories.find { it.id == entry.categoryId }) { edit(entry) } }
    }
}

@Composable fun <T> Choice(label: String, items: List<Pair<T, String>>, selected: T, onSelect: (T) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box { OutlinedButton(onClick = { expanded = true }) { Text("$label: ${items.find { it.first == selected }?.second ?: "Selecionar"}") }
        DropdownMenu(expanded, { expanded = false }) { items.forEach { (id, text) -> DropdownMenuItem(text = { Text(text) }, onClick = { onSelect(id); expanded = false }) } }
    }
}

@Composable fun Categories(data: Ledger, vm: SaldoViewModel) {
    var selected by remember { mutableStateOf<Category?>(null) }; var editing by remember { mutableStateOf(false) }
    var removing by remember { mutableStateOf<Category?>(null) }
    Text("Categorias", style = MaterialTheme.typography.titleLarge)
    Button(onClick = { selected = null; editing = true }) { Text("Nova categoria") }
    data.categories.forEach { c -> Card { Column(Modifier.fillMaxWidth().padding(12.dp)) {
        Text("${c.icon} ${c.name}${if (c.archived) " (arquivada)" else ""}")
        Row { TextButton(onClick = { selected = c; editing = true }) { Text("Editar") }
            if (c.archived) TextButton(onClick = { vm.change(change = { it.copy(categories = it.categories.map { row -> if (row.id == c.id) row.copy(archived = false) else row }) }) }) { Text("Reativar") }
            else TextButton(onClick = { removing = c }) { Text(if (data.entries.any { it.categoryId == c.id }) "Arquivar" else "Excluir") }
        }
    } } }
    removing?.let { c -> AlertDialog(onDismissRequest = { removing = null }, title = { Text("Remover categoria?") }, text = { Text("Categorias utilizadas serão arquivadas, preservando os lançamentos.") }, confirmButton = { TextButton(onClick = { vm.change(change = { ledger -> ledger.copy(categories = if (ledger.entries.any { it.categoryId == c.id }) ledger.categories.map { if (it.id == c.id) it.copy(archived = true) else it } else ledger.categories.filterNot { it.id == c.id }) }); removing = null }) { Text("Confirmar") } }, dismissButton = { TextButton(onClick = { removing = null }) { Text("Cancelar") } }) }
    if (editing) CategoryEditor(selected, onDismiss = { editing = false }) { c -> vm.change({ it.copy(categories = it.categories.filterNot { row -> row.id == c.id } + c) }) { editing = false } }
}

@Composable fun CategoryEditor(original: Category?, onDismiss: () -> Unit, onSave: (Category) -> Unit) {
    var name by remember { mutableStateOf(original?.name ?: "") }; var icon by remember { mutableStateOf(original?.icon ?: "●") }
    var color by remember { mutableStateOf(original?.color ?: 0xFF53AAA5) }
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Categoria") }, text = { Column(Modifier.verticalScroll(rememberScrollState())) {
        OutlinedTextField(name, { name = it.take(60) }, label = { Text("Nome") })
        Choice("Ícone", listOf("🍴", "🚗", "🏠", "🎬", "●", "💼", "🛒", "❤").map { it to it }, icon) { icon = it }
        Choice("Cor", listOf(0xFF53AAA5 to "Petróleo", 0xFFED8857 to "Laranja", 0xFFF1C761 to "Amarelo", 0xFF9365B5 to "Roxo", 0xFF6288B0 to "Azul", 0xFFCA5353 to "Vermelho"), color) { color = it }
    } }, confirmButton = { TextButton(onClick = { onSave(Category(original?.id ?: UUID.randomUUID().toString(), name.trim(), color, icon, original?.archived ?: false)) }, enabled = name.isNotBlank()) { Text("Salvar") } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } })
}
