import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppearance } from './Appearance';
import { groups, Ledger, monthEntries, totals } from './finance';
import { Button, Card, CategoryIcon, Empty, MetricCard, SectionHeader } from './ui';
import { spacing } from './theme/tokens';

export function HomeScreen({
  ledger,
  month,
  openHistory,
  onAdd,
  onCharts,
}: {
  ledger: Ledger;
  month: string;
  openHistory: (category: string) => void;
  onAdd: () => void;
  onCharts: () => void;
}) {
  const { palette, s, money, hidden } = useAppearance();
  const entries = monthEntries(ledger, month);
  const summary = totals(entries);
  const grouped = groups(ledger, month);
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <>
      <Card style={{ backgroundColor: palette.hero, padding: spacing.xl }}>
        <Text style={{ color: palette.heroMuted, fontSize: 15 }}>Saldo do mês</Text>
        <Text
          style={{
            color: palette.heroText,
            fontSize: stacked ? 28 : 35,
            fontWeight: '700',
            fontVariant: ['tabular-nums'],
          }}
        >
          {money(summary.balance)}
        </Text>
        <Text style={{ color: palette.heroMuted, fontSize: 14 }}>Receitas menos despesas</Text>
      </Card>
      {entries.length > 0 ? (
        <>
          <View style={s.wrap}>
            <MetricCard
              label="Receitas"
              value={money(summary.income)}
              tone="income"
              stacked={stacked}
            />
            <MetricCard
              label="Despesas"
              value={money(summary.expense)}
              tone="expense"
              stacked={stacked}
            />
          </View>
          {grouped.length > 0 && (
            <>
              <SectionHeader>Principais despesas</SectionHeader>
              <Card>
                {grouped.slice(0, 4).map((group, index) => (
                  <React.Fragment key={group.category.id}>
                    {index > 0 && <View style={s.divider} />}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${group.category.name}: ${money(group.cents)}. Ver lançamentos.`}
                      onPress={() => openHistory(group.category.id)}
                      style={({ pressed }) => [
                        s.row,
                        { minHeight: 48, opacity: pressed ? 0.65 : 1 },
                      ]}
                    >
                      <CategoryIcon category={group.category} size={36} />
                      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                        <Text style={s.text}>{group.category.name}</Text>
                        <Text
                          style={[s.text, { fontWeight: '600', fontVariant: ['tabular-nums'] }]}
                        >
                          {money(group.cents)}
                        </Text>
                      </View>
                      {!hidden && !stacked && (
                        <Text style={s.muted}>{group.percentage.toFixed(0)}%</Text>
                      )}
                      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
                    </Pressable>
                  </React.Fragment>
                ))}
                <Button secondary title="Ver todos os gastos" onPress={onCharts} />
              </Card>
            </>
          )}
        </>
      ) : (
        <Empty
          title={
            ledger.entries.length
              ? 'Nenhum lançamento neste mês'
              : 'Comece pelo primeiro lançamento'
          }
          text="Registre uma receita ou despesa para acompanhar seu saldo."
          actionLabel="Adicionar lançamento"
          onAction={onAdd}
        />
      )}
    </>
  );
}
