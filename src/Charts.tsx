import { useAppearance, Colors } from './Appearance';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import {
  categoryColor,
  groups,
  Ledger,
  monthEntries,
  monthName,
  shiftMonth,
  totals,
} from './finance';
import { CategoryIcon, Chip, Empty } from './ui';

const percentage = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;
const shortMonth = (value: string) => monthName(value).split(' ')[0].slice(0, 3);
const axisMoney = (cents: number) => {
  const value = cents / 100;
  if (value >= 1_000_000)
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (value >= 1_000)
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: value < 10 ? 2 : 0, maximumFractionDigits: value < 10 ? 2 : 0 })}`;
};

export function Charts({
  ledger,
  month,
  onCategory,
}: {
  ledger: Ledger;
  month: string;
  onCategory: (id: string) => void;
}) {
  const { palette, s, money, hidden } = useAppearance();
  const [view, setView] = useState<'categories' | 'trend'>('categories');
  // Reset month-specific selection when navigating to a different reporting period.
  return (
    <>
      <View style={s.wrap}>
        <Chip selected={view === 'categories'} onPress={() => setView('categories')}>
          Por categoria
        </Chip>
        <Chip selected={view === 'trend'} onPress={() => setView('trend')}>
          Evolução mensal
        </Chip>
      </View>
      {view === 'categories' ? (
        <CategoryChart key={month} ledger={ledger} month={month} onCategory={onCategory} />
      ) : (
        <MonthlyChart key={month} ledger={ledger} month={month} />
      )}
    </>
  );
}

function CategoryChart({
  ledger,
  month,
  onCategory,
}: {
  ledger: Ledger;
  month: string;
  onCategory: (id: string) => void;
}) {
  const { palette, s, money, hidden } = useAppearance();
  const styles = chartStyles(palette);
  const rows = groups(ledger, month);
  const summary = totals(monthEntries(ledger, month));
  const [details, setDetails] = useState(false);
  const [width, setWidth] = useState(260);
  const plotWidth = Math.max(80, width - 48);
  return (
    <>
      <View style={styles.summary}>
        <Text style={s.muted}>Despesas do mês</Text>
        <Text style={styles.amount}>{money(summary.expense)}</Text>
        {rows[0] ? (
          <Text style={s.text}>
            <Text style={{ fontWeight: '700' }}>{rows[0].category.name}</Text> concentra{' '}
            {hidden ? '••••' : percentage(rows[0].percentage)} dos seus gastos.
          </Text>
        ) : (
          <Text style={s.muted}>Seu resumo aparece assim que você registrar uma despesa.</Text>
        )}
      </View>
      {rows.length === 0 ? (
        <Empty
          title="Nenhuma despesa neste mês"
          text="Adicione uma despesa no botão + para descobrir para onde seu dinheiro vai."
        />
      ) : (
        <View style={s.card}>
          <Text style={s.heading}>Para onde foi seu dinheiro</Text>
          <Text style={s.muted}>Da maior para a menor despesa. Toque para ver os lançamentos.</Text>
          {rows.map((g) => (
            <Pressable
              key={g.category.id}
              accessibilityRole="button"
              accessibilityLabel={`${g.category.name}, ${money(g.cents)}, ${hidden ? 'valores ocultos' : percentage(g.percentage)} das despesas. Ver lançamentos.`}
              onPress={() => onCategory(g.category.id)}
              style={({ pressed }) => [styles.category, { opacity: pressed ? 0.65 : 1 }]}
            >
              <View style={s.row}>
                <CategoryIcon category={g.category} size={36} />
                <Text style={[s.text, { flex: 1, fontWeight: '600' }]}>{g.category.name}</Text>
                <Ionicons name="chevron-forward" size={17} color={palette.muted} />
              </View>
              <View style={[s.wrap, { justifyContent: 'space-between', gap: 4 }]}>
                <Text style={s.heading}>{money(g.cents)}</Text>
                <Text style={s.muted}>{hidden ? '••••' : percentage(g.percentage)} do total</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    width: hidden ? '0%' : `${g.percentage}%`,
                    backgroundColor: categoryColor(g.category.color),
                  }}
                />
              </View>
            </Pressable>
          ))}
          <Text style={[s.muted, { fontSize: 12 }]}>
            Cada barra representa a participação da categoria no total de despesas.
          </Text>
          <View style={s.divider} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            onPress={() => setDetails((v) => !v)}
            style={({ pressed }) => [styles.disclosure, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[s.text, { flex: 1, fontWeight: '600' }]}>Concentração dos gastos</Text>
            <Ionicons
              name={details ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={palette.teal}
            />
          </Pressable>
          {details && (
            <View style={{ gap: 12 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
              <Text style={s.muted}>
                A linha soma a participação de cada categoria, na ordem acima, até chegar a 100%.
              </Text>
              {!hidden && (
                <Svg width={width} height={175} accessible={false}>
                  {[0, 50, 100].map((p) => (
                    <React.Fragment key={p}>
                      <Line
                        x1={36}
                        x2={width - 12}
                        y1={145 - p * 1.2}
                        y2={145 - p * 1.2}
                        stroke={palette.border}
                      />
                      <SvgText x={0} y={149 - p * 1.2} fontSize={10} fill={palette.muted}>
                        {p}%
                      </SvgText>
                    </React.Fragment>
                  ))}
                  <Polyline
                    points={rows
                      .map(
                        (g, i) =>
                          `${36 + (plotWidth * (i + 0.5)) / rows.length},${145 - g.cumulative * 1.2}`,
                      )
                      .join(' ')}
                    fill="none"
                    stroke={palette.teal}
                    strokeWidth={3}
                  />
                  {rows.map((g, i) => (
                    <React.Fragment key={g.category.id}>
                      <Circle
                        cx={36 + (plotWidth * (i + 0.5)) / rows.length}
                        cy={145 - g.cumulative * 1.2}
                        r={4}
                        fill={palette.teal}
                      />
                      <SvgText
                        x={36 + (plotWidth * (i + 0.5)) / rows.length}
                        y={164}
                        fontSize={10}
                        fill={palette.muted}
                        textAnchor="middle"
                      >
                        {i + 1}
                      </SvgText>
                    </React.Fragment>
                  ))}
                </Svg>
              )}
              {rows.map((g, i) => (
                <Text key={g.category.id} style={s.muted}>
                  {i + 1}. {g.category.name} · acumulado{' '}
                  {hidden ? '••••' : percentage(g.cumulative)}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );
}

function MonthlyChart({ ledger, month }: { ledger: Ledger; month: string }) {
  const { palette, s, money, hidden } = useAppearance();
  const styles = chartStyles(palette);
  const months = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonth(month, i - 5);
    return { key, ...totals(monthEntries(ledger, key)) };
  });
  const [selected, setSelected] = useState(month);
  const [width, setWidth] = useState(260);
  const current = months.find((m) => m.key === selected)!;
  const maximum = Math.max(100, ...months.flatMap((m) => [m.income, m.expense]));
  const left = 72;
  const plotWidth = Math.max(80, width - left);
  const hasData = months.some((m) => m.income || m.expense);
  return (
    <View style={s.card} onLayout={(e) => setWidth(Math.max(160, e.nativeEvent.layout.width - 36))}>
      <Text style={s.heading}>Seu ritmo nos últimos seis meses</Text>
      <Text style={s.muted}>
        Compare o que entrou e saiu. Selecione um mês para ver os valores.
      </Text>
      <View style={s.wrap}>
        <Legend color={palette.income} label="Receitas" />
        <Legend color={palette.expense} label="Despesas" />
      </View>
      {hasData ? (
        <>
          {!hidden && (
            <Svg width={width} height={185} accessible={false}>
              {[0, 0.5, 1].map((p) => (
                <React.Fragment key={p}>
                  <Line
                    x1={left}
                    x2={width}
                    y1={165 - p * 140}
                    y2={165 - p * 140}
                    stroke={palette.border}
                  />
                  <SvgText x={0} y={169 - p * 140} fontSize={10} fill={palette.muted}>
                    {axisMoney(maximum * p)}
                  </SvgText>
                </React.Fragment>
              ))}
              {months.map((m, i) => {
                const step = plotWidth / 6;
                const bar = Math.min(14, step * 0.28);
                const x = left + step * (i + 0.5);
                return (
                  <G key={m.key} onPress={() => setSelected(m.key)}>
                    <Rect x={left + step * i} y={15} width={step} height={150} fill="transparent" />
                    {selected === m.key && (
                      <Rect
                        x={left + step * i + 1}
                        y={15}
                        width={Math.max(1, step - 2)}
                        height={150}
                        rx={6}
                        fill={palette.selected}
                      />
                    )}
                    <Rect
                      x={x - bar - 1}
                      y={165 - (m.income / maximum) * 140}
                      width={bar}
                      height={(m.income / maximum) * 140}
                      rx={3}
                      fill={palette.income}
                    />
                    <Rect
                      x={x + 1}
                      y={165 - (m.expense / maximum) * 140}
                      width={bar}
                      height={(m.expense / maximum) * 140}
                      rx={3}
                      fill={palette.expense}
                    />
                    <SvgText x={x} y={181} fontSize={10} textAnchor="middle" fill={palette.muted}>
                      {shortMonth(m.key)}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          )}
          <View style={[s.wrap, { gap: 8 }]}>
            {months.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setSelected(m.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === m.key }}
                accessibilityLabel={`${monthName(m.key)}. Receitas ${money(m.income)}, despesas ${money(m.expense)}, saldo ${money(m.balance)}.`}
                style={({ pressed }) => [
                  styles.month,
                  selected === m.key && styles.selectedMonth,
                  { opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <Text
                  style={[
                    s.text,
                    {
                      fontSize: 13,
                      textTransform: 'capitalize',
                      color: selected === m.key ? palette.teal : palette.muted,
                    },
                  ]}
                >
                  {shortMonth(m.key)} {m.key.slice(2, 4)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.monthDetails}>
            <Text style={[s.heading, { textTransform: 'capitalize' }]}>
              {monthName(current.key)}
            </Text>
            <Detail label="Receitas" value={money(current.income)} color={palette.income} />
            <Detail label="Despesas" value={money(current.expense)} color={palette.expense} />
            <View style={s.divider} />
            <Detail
              label="Saldo do mês"
              value={money(current.balance)}
              color={!hidden && current.balance < 0 ? palette.expense : palette.navy}
            />
          </View>
        </>
      ) : (
        <Empty
          title="Sua evolução começa aqui"
          text="Os últimos seis meses vão aparecer conforme você registrar receitas e despesas."
        />
      )}
      <Text style={[s.muted, { fontSize: 12 }]}>
        O saldo considera apenas as receitas e despesas de cada mês.
      </Text>
    </View>
  );
}

function Detail({ label, value, color }: { label: string; value: string; color: string }) {
  const { palette, s, money, hidden } = useAppearance();
  return (
    <View style={[s.wrap, { justifyContent: 'space-between', gap: 4 }]}>
      <Text style={s.text}>{label}</Text>
      <Text style={[s.text, { color, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  const { palette, s, money, hidden } = useAppearance();
  return (
    <View style={s.row}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}
const chartStyles = (palette: Colors) =>
  StyleSheet.create({
    summary: { backgroundColor: palette.selected, borderRadius: 20, padding: 20, gap: 8 },
    amount: { color: palette.navy, fontSize: 30, fontWeight: '700' },
    category: { paddingVertical: 10, gap: 10, minHeight: 48 },
    track: { height: 8, backgroundColor: palette.track, borderRadius: 4, overflow: 'hidden' },
    disclosure: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
    month: {
      paddingHorizontal: 10,
      paddingVertical: 12,
      borderRadius: 12,
      minHeight: 44,
      minWidth: '28%',
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: palette.background,
    },
    selectedMonth: { backgroundColor: palette.selected, borderWidth: 1, borderColor: palette.teal },
    monthDetails: { backgroundColor: palette.background, borderRadius: 16, padding: 16, gap: 12 },
  });
