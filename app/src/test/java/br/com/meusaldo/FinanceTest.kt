package br.com.meusaldo

import org.junit.Assert.*
import org.junit.Test
import java.time.YearMonth
import kotlinx.coroutines.test.runTest

class FinanceTest {
    private fun entry(id: String, cents: Long, date: String = "2026-10-01", kind: Kind = Kind.DESPESA, category: String? = "food") = Entry(id, kind, cents, date, category)
    @Test fun moneyUsesExactCents() {
        assertEquals(12550L, parseCents("125,50")); assertEquals(1L, parseCents("0.01"))
        assertThrows(IllegalArgumentException::class.java) { parseCents("12,345") }
        assertThrows(IllegalArgumentException::class.java) { parseCents("0") }
        assertThrows(IllegalArgumentException::class.java) { parseCents("-1") }
    }
    @Test fun monthlyBalanceAndYearBoundary() {
        val ledger = Ledger(entries = listOf(entry("1", 500, "2025-12-31"), entry("2", 100, "2026-01-01", Kind.RECEITA, null), entry("3", 200, "2026-01-31")))
        assertEquals(-100L, totals(ledger.month(YearMonth.of(2026, 1))).balance)
        assertEquals(1, ledger.month(YearMonth.of(2025, 12)).size)
        assertEquals(0L, totals(emptyList()).balance)
    }
    @Test fun paretoSortedAndEndsAt100() {
        val ledger = Ledger(entries = listOf(entry("1", 300), entry("2", 700, category = "bills")))
        val groups = ledger.groups(YearMonth.of(2026, 10))
        assertEquals("bills", groups.first().category.id); assertEquals(70.0, groups.first().cumulative, .001)
        assertEquals(100.0, groups.last().cumulative, .001)
        assertTrue(Ledger().groups(YearMonth.now()).isEmpty())
    }
    @Test fun backupValidationAndRoundTrip() {
        val ledger = Ledger(entries = listOf(entry("1", 123)))
        assertEquals(ledger, decode(encode(ledger)))
        assertThrows(Exception::class.java) { decode("broken") }
        assertThrows(IllegalArgumentException::class.java) { validate(ledger.copy(version = 2)) }
        assertThrows(IllegalArgumentException::class.java) { validate(ledger.copy(entries = listOf(entry("1", 10, category = "missing")))) }
        assertThrows(IllegalArgumentException::class.java) { validate(ledger.copy(entries = ledger.entries + ledger.entries)) }
        assertThrows(Exception::class.java) { validate(ledger.copy(entries = listOf(entry("1", 10, "2026-02-30")))) }
    }
    @Test fun repositoryPreservesPreviousStateOnWriteFailure() = runTest {
        val storage = MemoryStorage(); val repo = LocalRepository(storage); repo.load()
        val old = repo.update { it.copy(entries = listOf(entry("1", 100))) }
        val saved = storage.text; storage.fail = true
        try { repo.update { it.copy(entries = emptyList()) }; fail("Expected write failure") } catch (_: java.io.IOException) { }
        assertEquals(saved, storage.text)
        try { repo.restore(Ledger()); fail("Expected restore failure") } catch (_: java.io.IOException) { }
        storage.fail = false
        assertEquals(old, repo.update { it })
        assertEquals(old, LocalRepository(storage).load())
    }
    @Test fun corruptedFileIsNotOverwritten() = runTest {
        val storage = MemoryStorage().apply { text = "corrupted" }; val repo = LocalRepository(storage)
        try { repo.load(); fail("Expected read failure") } catch (_: Exception) { }
        assertEquals("corrupted", storage.text)
        repo.restore(Ledger()); assertEquals(Ledger(), repo.load())
    }
    @Test fun archivedCategoryKeepsHistoricalTotals() {
        val data = Ledger(categories = defaults().map { it.copy(archived = true) }, entries = listOf(entry("1", 500)))
        validate(data); assertEquals(500L, data.groups(YearMonth.of(2026, 10)).first().cents)
    }
    private class MemoryStorage: LedgerStorage {
        var text: String? = null; var fail = false
        override fun read() = text
        override fun write(text: String) { if (fail) throw java.io.IOException("No space"); this.text = text }
    }
}
