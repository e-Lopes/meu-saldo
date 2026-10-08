import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useAppearance } from './Appearance';
import {
  groups,
  Kind,
  Ledger,
  monthEntries,
  totals,
  upcomingOccurrences,
  monthlyComparison,
  dateLabel,
  shiftMonth,
  monthName,
} from './finance';
import { Card, CategoryIcon, Empty, MetricCard, SectionHeader } from './ui';
import { spacing } from './theme/tokens';

export function HomeScreen({
  ledger,
  month,
  openHistory,
  onAdd,
  onCharts,
  onKindHistory,
}: {
  ledger: Ledger;
  month: string;
  openHistory: (category: string, kind?: Kind) => void;
  onAdd: (kind?: Kind) => void;
  onCharts: (kind?: Kind) => void;
  onKindHistory: (kind: Kind) => void;
}) {
  const { palette, s, money } = useAppearance();
  const entries = monthEntries(ledger, month);
  const summary = totals(entries);
  const grouped = groups(ledger, month);
  const incomeGroups = groups(ledger, month, 'RECEITA');
  const { width, fontScale } = useWindowDimensions();
  const comparison = monthlyComparison(ledger, month);
  const upcoming = upcomingOccurrences(ledger);
  const stacked = width < 360 || fontScale > 1.2;
  return (
    <>
      <Card style={{ backgroundColor: palette.hero, padding: spacing.md, gap: spacing.sm }}>
        <Text style={{ color: palette.heroMuted, fontSize: 16 }}>Saldo do mês</Text>
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
        <View style={s.wrap}>
          <MetricCard
            label="Receitas"
            value={money(summary.income)}
            tone="income"
            stacked={stacked}
            onPress={() => onKindHistory('RECEITA')}
          />
          <MetricCard
            label="Despesas"
            value={money(summary.expense)}
            tone="expense"
            stacked={stacked}
            onPress={() => onKindHistory('DESPESA')}
          />
        </View>
      </Card>
      {entries.length > 0 ? (
        <>
          <View
            style={{
              flexDirection: stacked ? 'column' : 'row',
              alignItems: stacked ? 'stretch' : 'flex-start',
              gap: spacing.sm,
            }}
          >
            {(['RECEITA', 'DESPESA'] as const).map((kind) => {
              const rows = kind === 'RECEITA' ? incomeGroups : grouped;
              return (
                <View key={kind} style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
                  <SectionHeader>
                    {kind === 'RECEITA' ? 'Principais receitas' : 'Principais despesas'}
                  </SectionHeader>
                  <Card style={{ padding: spacing.sm, gap: 0 }}>
                    {rows.slice(0, 3).map((group, index) => (
                      <View key={group.category.id || 'uncategorized'}>
                        {index > 0 && (
                          <View style={[s.divider, { opacity: 0.35, marginVertical: 8 }]} />
                        )}
                        <Pressable
                          key={group.category.id || 'uncategorized'}
                          accessibilityRole="button"
                          accessibilityLabel={`${group.category.name}: ${kind === 'RECEITA' ? 'receita' : 'despesa'} ${money(group.cents)}, ${group.percentage.toFixed(1).replace('.', ',')}% do total. Ver lançamentos.`}
                          onPress={() => openHistory(group.category.id, kind)}
                          style={({ pressed }) => ({
                            minHeight: 64,
                            gap: 8,
                            paddingVertical: 8,
                            backgroundColor: pressed ? palette.selected : 'transparent',
                            borderRadius: 8,
                          })}
                        >
                          <View style={[s.row, { minHeight: 48 * fontScale }]}>
                            <CategoryIcon category={group.category} />
                            <Text
                              numberOfLines={2}
                              ellipsizeMode="tail"
                              style={[s.text, { flex: 1 }]}
                            >
                              {group.category.name}
                            </Text>
                          </View>
                          <View
                            style={[
                              s.row,
                              { alignItems: 'baseline', justifyContent: 'space-between' },
                            ]}
                          >
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.8}
                              style={[
                                s.text,
                                {
                                  fontWeight: '700',
                                  flex: 1,
                                  minWidth: 0,
                                  color: kind === 'RECEITA' ? palette.income : palette.expense,
                                },
                              ]}
                            >
                              {kind === 'RECEITA' ? '+' : '−'} {money(group.cents)}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={[
                                s.muted,
                                {
                                  textAlign: 'right',
                                  flexShrink: 0,
                                  fontVariant: ['tabular-nums'],
                                },
                              ]}
                            >
                              {`${group.percentage.toFixed(1).replace('.', ',')}%`}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                    {!rows.length && <Text style={s.muted}>Sem lançamentos</Text>}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onCharts(kind)}
                      accessibilityLabel={
                        kind === 'RECEITA' ? 'Ver todas as receitas' : 'Ver todas as despesas'
                      }
                      style={{
                        minHeight: 48,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: palette.accent, fontSize: 16 }}>Ver todas</Text>
                    </Pressable>
                  </Card>
                </View>
              );
            })}
          </View>
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
          onAction={() => onAdd()}
        />
      )}
      <Card>
        <Text style={s.heading}>Em relação a {monthName(shiftMonth(month, -1))}</Text>
        <Text style={s.muted}>Diferença de receitas e despesas no mês selecionado.</Text>
        {(['income', 'expense'] as const).map((key) => (
          <View key={key} style={[s.row, { justifyContent: 'space-between' }]}>
            <Text style={s.text}>{key === 'income' ? 'Receitas' : 'Despesas'}</Text>
            <Text style={s.text}>
              {comparison[key] > 0 ? '+' : comparison[key] < 0 ? '−' : ''}{' '}
              {money(Math.abs(comparison[key]))}
            </Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={s.heading}>Próximas recorrências</Text>
        <Text style={s.muted}>Próximos sete dias. Estes valores ainda não entram no saldo.</Text>
        {upcoming.length === 0 ? (
          <Text style={s.muted}>Nenhuma recorrência prevista para os próximos sete dias.</Text>
        ) : (
          upcoming.map((item) => (
            <View key={item.id} style={[s.row, { alignItems: 'center' }]}>
              <CategoryIcon
                category={
                  ledger.categories.find((c) => c.id === item.categoryId) ?? {
                    icon: 'savings',
                    color: 0,
                    colorKey: 'teal',
                  }
                }
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={s.text}>
                  {item.description ||
                    ledger.categories.find((c) => c.id === item.categoryId)?.name ||
                    'Receita'}
                </Text>
                <Text style={s.muted}>{dateLabel(item.date)}</Text>
              </View>
              <Text
                style={[
                  s.text,
                  { color: item.kind === 'RECEITA' ? palette.income : palette.expense },
                ]}
              >
                {item.kind === 'RECEITA' ? '+' : '−'} {money(item.cents)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}
