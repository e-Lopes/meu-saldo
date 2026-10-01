package br.com.meusaldo

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

private val Brazilian = Locale.forLanguageTag("pt-BR")
private val ExpenseRed = Color(0xFFB94B54)
private fun percent(value: Double) = String.format(Brazilian, "%.0f%%", value)

@Composable fun AppHeader(month: YearMonth, categories: Boolean, onPrevious: () -> Unit, onNext: () -> Unit, onToday: () -> Unit, onBack: () -> Unit) {
    Column(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Teal, Color(0xFF286D7B)))).statusBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            if (categories) IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar ao menu", tint = Color.White) }
            else Icon(Icons.Default.AccountBalanceWallet, null, tint = Color.White, modifier = Modifier.size(28.dp))
            Text(if (categories) "Categorias" else "Meu Saldo", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        if (!categories) Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            IconButton(onClick = onPrevious, modifier = Modifier.background(Color.White.copy(alpha = .12f), CircleShape)) { Icon(Icons.Default.ChevronLeft, "Mês anterior", tint = Color.White) }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(month.format(DateTimeFormatter.ofPattern("MMMM yyyy", Brazilian)).replaceFirstChar { it.titlecase(Brazilian) }, color = Color.White, fontWeight = FontWeight.SemiBold)
                if (month != YearMonth.now()) TextButton(onClick = onToday, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp), modifier = Modifier.heightIn(min = 48.dp)) { Text("Voltar ao mês atual", color = Color.White, style = MaterialTheme.typography.labelMedium) }
            }
            IconButton(onClick = onNext, modifier = Modifier.background(Color.White.copy(alpha = .12f), CircleShape)) { Icon(Icons.Default.ChevronRight, "Próximo mês", tint = Color.White) }
        }
    }
}

@Composable fun AppNavigation(selected: Int, enabled: Boolean, onTab: (Int) -> Unit, onAdd: () -> Unit) {
    Surface(shadowElevation = 8.dp, color = Color.White) {
        Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 4.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf("Início", "Gráficos", "Adicionar", "Transações", "Menu").forEachIndexed { index, label ->
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    if (index == 2) {
                        Button(onClick = onAdd, enabled = enabled, shape = CircleShape, contentPadding = PaddingValues(0.dp), modifier = Modifier.size(52.dp)) { Icon(Icons.Default.Add, "Adicionar lançamento", modifier = Modifier.size(30.dp)) }
                        Text(label, color = Teal, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 4.dp))
                    } else {
                        val color = if (selected == index) Teal else Color(0xFF6B798B)
                        Column(Modifier.fillMaxWidth().clickable(enabled = enabled, onClickLabel = "Abrir $label") { onTab(index) }.padding(vertical = 6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(Modifier.background(if (selected == index) Teal.copy(alpha = .1f) else Color.Transparent, RoundedCornerShape(16.dp)).padding(horizontal = 12.dp, vertical = 4.dp)) {
                                Icon(listOf(Icons.Default.Home, Icons.Default.BarChart, Icons.Default.Add, Icons.Default.ReceiptLong, Icons.Default.Menu)[index], null, tint = color)
                            }
                            Text(label, color = color, style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }
    }
}

fun categoryImage(icon: String): ImageVector = when (icon) {
    "🍴" -> Icons.Default.Restaurant
    "🚗" -> Icons.Default.DirectionsCar
    "🏠" -> Icons.Default.Home
    "🎬" -> Icons.Default.Movie
    "💼" -> Icons.Default.Work
    "🛒" -> Icons.Default.ShoppingCart
    "❤" -> Icons.Default.Favorite
    else -> Icons.Default.Category
}

@Composable fun CategoryBadge(category: Category?, income: Boolean = false) {
    val color = category?.let { Color(it.color) } ?: Teal
    Box(Modifier.size(42.dp).background(color.copy(alpha = .14f), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
        Icon(if (category == null && income) Icons.Default.TrendingUp else categoryImage(category?.icon ?: "●"), null, tint = color, modifier = Modifier.size(23.dp))
    }
}

@Composable fun EmptyPanel(title: String, message: String, action: String? = null, onAction: () -> Unit = {}) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(Icons.Default.AccountBalanceWallet, null, tint = Teal, modifier = Modifier.size(36.dp))
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            if (action != null) Button(onClick = onAction) { Text(action) }
        }
    }
}

@Composable fun HomeDashboard(data: Ledger, month: YearMonth, onAdd: () -> Unit, onCategory: (String) -> Unit) {
    val sum = totals(data.month(month)); val groups = data.groups(month)
    Card(colors = CardDefaults.cardColors(containerColor = Navy), elevation = CardDefaults.cardElevation(4.dp)) {
        Column(Modifier.fillMaxWidth().padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("SALDO DO MÊS", style = MaterialTheme.typography.labelLarge, color = Color(0xFFB9CDDE))
                Surface(color = Color.White.copy(alpha = .1f), shape = RoundedCornerShape(20.dp)) {
                    Text(if (sum.balance < 0) "Negativo" else if (sum.balance > 0) "Sobrou" else "Saldo zero", modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp), color = if (sum.balance < 0) Color(0xFFFFB0B7) else Color(0xFFB5ECE0), style = MaterialTheme.typography.labelMedium)
                }
            }
            Text(money(sum.balance), color = if (sum.balance < 0) Color(0xFFFFB0B7) else Color.White, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
            HorizontalDivider(color = Color.White.copy(alpha = .15f))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                BalanceMetric("Receitas", sum.income, Color(0xFF95DDC9), Modifier.weight(1f))
                BalanceMetric("Despesas", sum.expense, Color(0xFFFFB0B7), Modifier.weight(1f))
            }
        }
    }
    if (data.month(month).isEmpty()) EmptyPanel("Comece pelo primeiro lançamento", "Registre uma receita ou despesa para acompanhar este mês.", "Adicionar lançamento", onAdd)
    else if (groups.isEmpty()) EmptyPanel("Nenhuma despesa neste mês", "Suas receitas já estão no saldo. As despesas aparecerão aqui quando forem adicionadas.")
    else {
        ExpenseChart(groups)
        Text("Resumo por grupos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Navy)
        Text("Toque em um grupo para ver os lançamentos", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        BoxWithConstraints {
            val columns = if (maxWidth < 330.dp || LocalDensity.current.fontScale > 1.25f) 1 else 2
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                groups.chunked(columns).forEach { row -> Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { group -> Card(onClick = { onCategory(group.category.id) }, modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                CategoryBadge(group.category)
                                Text(group.category.name, style = MaterialTheme.typography.labelLarge, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            }
                            Text(money(group.cents), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Navy)
                            Text("${percent(group.percentage)} das despesas", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            LinearProgressIndicator(progress = { (group.percentage / 100).toFloat() }, modifier = Modifier.fillMaxWidth().height(5.dp), color = Color(group.category.color), trackColor = Color(0xFFEDF0F5))
                        }
                    } }
                    if (row.size < columns) Spacer(Modifier.weight(1f))
                } }
            }
        }
    }
}

@Composable private fun BalanceMetric(label: String, cents: Long, color: Color, modifier: Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(if (label == "Receitas") Icons.Default.ArrowDownward else Icons.Default.ArrowUpward, null, tint = color, modifier = Modifier.size(16.dp))
            Text(label, color = Color(0xFFB9CDDE), style = MaterialTheme.typography.bodySmall)
        }
        Text(money(cents), color = Color.White, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
    }
}

@Composable fun ExpenseChart(groups: List<Group>) {
    Text("Distribuição de gastos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Navy)
    if (groups.isEmpty()) { EmptyPanel("Sem despesas para analisar", "Adicione despesas para ver sua distribuição por categoria."); return }
    Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Valor por categoria e percentual acumulado", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            BoxWithConstraints {
                val chartWidth = maxOf(maxWidth, (groups.size * 84).dp)
                Row(Modifier.horizontalScroll(rememberScrollState())) {
                    Canvas(Modifier.width(chartWidth).height(230.dp).semantics { contentDescription = "Gráfico de despesas. Valores, categorias e percentuais disponíveis na lista abaixo." }) {
                        val top = 32.dp.toPx(); val bottom = size.height - 36.dp.toPx(); val height = bottom - top
                        val step = size.width / groups.size
                        val max = groups.maxOf { it.cents }.toDouble()
                        val text = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.rgb(23, 48, 79); textSize = 10.sp.toPx(); textAlign = android.graphics.Paint.Align.CENTER }
                        repeat(4) { i -> val y = bottom - height * i / 3; drawLine(Color(0xFFE9EFF4), Offset(0f, y), Offset(size.width, y), 1.dp.toPx()) }
                        groups.forEachIndexed { i, group ->
                            val x = step * (i + .5f); val h = (height * group.cents / max).toFloat() * .88f
                            drawRoundRect(Color(group.category.color), Offset(x - step * .26f, bottom - h), Size(step * .52f, h), androidx.compose.ui.geometry.CornerRadius(5.dp.toPx()))
                            drawIntoCanvas { canvas ->
                                canvas.nativeCanvas.drawText(money(group.cents), x, bottom - h - 7.dp.toPx(), text)
                                val name = group.category.name.let { if (it.length > 12) it.take(11) + "…" else it }
                                canvas.nativeCanvas.drawText(name, x, bottom + 21.dp.toPx(), text)
                            }
                        }
                        var previous: Offset? = null
                        groups.forEachIndexed { i, group ->
                            val point = Offset(step * (i + .5f), bottom - height * (group.cumulative / 100).toFloat())
                            previous?.let { drawLine(Navy, it, point, 2.dp.toPx()) }
                            drawCircle(Color.White, 5.dp.toPx(), point); drawCircle(Navy, 3.dp.toPx(), point)
                            drawIntoCanvas { it.nativeCanvas.drawText(percent(group.cumulative), point.x, point.y - 9.dp.toPx(), text) }
                            previous = point
                        }
                    }
                }
            }
            groups.forEach { group -> Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(8.dp).background(Color(group.category.color), CircleShape))
                Text(group.category.name, Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                Text("${money(group.cents)} · ${percent(group.percentage)}", style = MaterialTheme.typography.labelMedium)
            } }
            Text("A linha soma a participação dos grupos no total de despesas, até 100%.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable fun TransactionRow(entry: Entry, category: Category?, onClick: () -> Unit) {
    Card(onClick = onClick, colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CategoryBadge(category, entry.kind == Kind.RECEITA)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(entry.description.ifBlank { category?.name ?: "Receita" }, style = MaterialTheme.typography.titleSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(category?.name ?: "Receita", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                Text("${if (entry.kind == Kind.RECEITA) "+" else "−"} ${money(entry.cents)}", color = if (entry.kind == Kind.RECEITA) Teal else ExpenseRed, fontWeight = FontWeight.SemiBold)
            }
            Icon(Icons.Default.ChevronRight, "Editar lançamento", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable fun MonthlyComparison(data: Ledger, end: YearMonth) {
    val months = (5 downTo 0).map { end.minusMonths(it.toLong()) }
    val sums = months.map { totals(data.month(it)) }
    val max = sums.maxOf { maxOf(it.income, it.expense) }.coerceAtLeast(1).toDouble()
    Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Receitas e despesas", fontWeight = FontWeight.SemiBold, color = Navy)
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("↓ Receitas", color = Teal, style = MaterialTheme.typography.labelMedium)
                Text("↑ Despesas", color = ExpenseRed, style = MaterialTheme.typography.labelMedium)
            }
            Canvas(Modifier.fillMaxWidth().height(180.dp).semantics { contentDescription = "Comparação dos últimos seis meses. Os valores estão listados abaixo." }) {
                val bottom = size.height - 28.dp.toPx(); val height = bottom - 12.dp.toPx(); val step = size.width / 6
                val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.rgb(70, 90, 110); textSize = 10.sp.toPx(); textAlign = android.graphics.Paint.Align.CENTER }
                repeat(4) { i -> val y = bottom - height * i / 3; drawLine(Color(0xFFE9EFF4), Offset(0f, y), Offset(size.width, y), 1.dp.toPx()) }
                sums.forEachIndexed { i, s ->
                    listOf(s.income to Teal, s.expense to ExpenseRed).forEachIndexed { j, (value, color) ->
                        val h = (height * value / max).toFloat()
                        drawRoundRect(color, Offset(step * i + step * (.12f + j * .4f), bottom - h), Size(step * .28f, h), androidx.compose.ui.geometry.CornerRadius(3.dp.toPx()))
                    }
                    drawIntoCanvas { it.nativeCanvas.drawText(months[i].format(DateTimeFormatter.ofPattern("MMM", Brazilian)), step * (i + .5f), bottom + 20.dp.toPx(), paint) }
                }
            }
            months.zip(sums).forEach { (m, s) ->
                HorizontalDivider(color = Color(0xFFE9EFF4))
                Text(m.format(DateTimeFormatter.ofPattern("MMMM yyyy", Brazilian)), style = MaterialTheme.typography.labelLarge, color = Navy)
                Text("Receitas ${money(s.income)}\nDespesas ${money(s.expense)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable fun SettingsPanel(enabled: Boolean, onCategories: () -> Unit, onExport: () -> Unit, onImport: () -> Unit) {
    Text("Organize do seu jeito", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Navy)
    SettingsAction(Icons.Default.Category, "Categorias", "Escolha nomes, ícones e cores", enabled, onCategories)
    Text("Seus backups", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Navy)
    SettingsAction(Icons.Default.FileUpload, "Exportar backup", "Salvar uma cópia dos seus registros", enabled, onExport)
    SettingsAction(Icons.Default.FileDownload, "Restaurar backup", "Recuperar registros de um arquivo", enabled, onImport)
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFE6F1EE))) { Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(Icons.Default.Lock, null, tint = Teal)
        Text("Só no seu celular", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = Navy)
        Text("Seus registros ficam neste aparelho. Sem conta, anúncios ou envio dos seus registros financeiros. A internet é usada apenas para buscar e baixar atualizações.", style = MaterialTheme.typography.bodyMedium)
        Text("O backup não é criptografado: guarde o arquivo em um lugar seguro. Desinstalar o app ou limpar os dados apaga os registros locais.", style = MaterialTheme.typography.bodySmall)
    } }
    Text("Meu Saldo ${BuildConfig.VERSION_NAME}\nPara atualizar, instale o novo APK sem desinstalar o app.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

@Composable private fun SettingsAction(icon: ImageVector, title: String, subtitle: String, enabled: Boolean, onClick: () -> Unit) {
    Card(onClick = onClick, enabled = enabled, colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.fillMaxWidth().padding(18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Icon(icon, null, tint = Teal)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) { Text(title, fontWeight = FontWeight.SemiBold); Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
