package br.com.meusaldo

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.text.NumberFormat
import java.util.Locale

@Serializable enum class Kind { RECEITA, DESPESA }
@Serializable data class Category(val id: String, val name: String, val color: Long, val icon: String, val archived: Boolean = false)
@Serializable data class Entry(val id: String, val kind: Kind, val cents: Long, val date: String, val categoryId: String? = null, val description: String = "")
@Serializable data class Ledger(val version: Int = 1, val categories: List<Category> = defaults(), val entries: List<Entry> = emptyList())
fun defaults() = listOf(
    Category("food", "Alimentação", 0xFFED8857, "🍴"), Category("transport", "Transporte", 0xFFF1C761, "🚗"),
    Category("bills", "Contas", 0xFF53AAA5, "🏠"), Category("fun", "Lazer", 0xFF9365B5, "🎬"), Category("other", "Outros", 0xFF6288B0, "●")
)
val codec = Json { encodeDefaults = true; ignoreUnknownKeys = false }
const val MAX_BACKUP_BYTES = 10 * 1024 * 1024
fun validate(data: Ledger): Ledger {
    require(data.version == 1) { "Versão de backup não suportada." }
    require(data.categories.map { it.id }.distinct().size == data.categories.size) { "Categorias duplicadas." }
    require(data.entries.map { it.id }.distinct().size == data.entries.size) { "Lançamentos duplicados." }
    data.categories.forEach { require(it.id.isNotBlank() && it.name.isNotBlank() && it.name.length <= 60 && it.color in 0..0xFFFFFFFFL && it.icon in listOf("🍴", "🚗", "🏠", "🎬", "●", "💼", "🛒", "❤")) { "Categoria inválida." } }
    data.entries.forEach {
        require(it.id.isNotBlank() && it.cents in 1..100_000_000_000L && it.description.length <= 300) { "Lançamento inválido." }
        require(LocalDate.parse(it.date).toString() == it.date) { "Data inválida." }
        require(it.kind != Kind.DESPESA || it.categoryId != null) { "Despesa sem categoria." }
        require(it.categoryId == null || data.categories.any { c -> c.id == it.categoryId }) { "Categoria inexistente." }
    }
    data.entries.fold(0L) { sum, e -> Math.addExact(sum, e.cents) }
    return data
}
fun decode(text: String): Ledger = validate(codec.decodeFromString<Ledger>(text))
fun encode(data: Ledger): String = codec.encodeToString(Ledger.serializer(), validate(data)).also {
    require(it.toByteArray(Charsets.UTF_8).size <= MAX_BACKUP_BYTES) { "Limite de armazenamento de 10 MB atingido. Nenhum dado foi alterado." }
}
fun parseCents(text: String): Long {
    require(Regex("[0-9]+([,.][0-9]{1,2})?").matches(text.trim())) { "Use um valor como 125,50." }
    return BigDecimal(text.trim().replace(',', '.')).movePointRight(2).longValueExact().also { require(it in 1..100_000_000_000L) { "Valor fora do limite." } }
}
fun money(cents: Long): String = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(BigDecimal.valueOf(cents, 2))
fun Ledger.month(month: YearMonth) = entries.filter { YearMonth.from(LocalDate.parse(it.date)) == month }
data class Totals(val income: Long, val expense: Long) { val balance get() = income - expense }
fun totals(entries: List<Entry>) = Totals(entries.filter { it.kind == Kind.RECEITA }.sumOf { it.cents }, entries.filter { it.kind == Kind.DESPESA }.sumOf { it.cents })
data class Group(val category: Category, val cents: Long, val percentage: Double, val cumulative: Double)
fun Ledger.groups(month: YearMonth): List<Group> {
    val expenses = month(month).filter { it.kind == Kind.DESPESA }
    val total = expenses.sumOf { it.cents }
    if (total == 0L) return emptyList()
    var accumulated = 0L
    return expenses.groupBy { it.categoryId }.map { (id, rows) -> categories.first { it.id == id } to rows.sumOf { it.cents } }
        .sortedWith(compareByDescending<Pair<Category, Long>> { it.second }.thenBy { it.first.name })
        .map { (c, value) -> accumulated += value; Group(c, value, value * 100.0 / total, accumulated * 100.0 / total) }
}
