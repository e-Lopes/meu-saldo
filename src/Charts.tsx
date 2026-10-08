import { useAppearance, Colors } from './Appearance';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import {
  categoryColor,
  groups,
  Kind,
  Ledger,
  monthEntries,
  monthName,
  shiftMonth,
  totals,
} from './finance';
import { Empty, SegmentedControl } from './ui';

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
  initialKind = 'DESPESA',
}: {
  ledger: Ledger;
  month: string;
  onCategory: (id: string, kind?: Kind) => void;
  initialKind?: Kind;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  // Reset month-specific selection when navigating to a different reporting period.
  return (
    <>
      <>
        <SegmentedControl
          label="Tipo de categoria"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'DESPESA', label: 'Despesas' },
            { value: 'RECEITA', label: 'Receitas' },
          ]}
        />
        <CategoryChart
          key={`${month}/${kind}`}
          ledger={ledger}
          month={month}
          kind={kind}
          onCategory={onCategory}
        />
        <MonthlyChart key={month} ledger={ledger} month={month} />
      </>
    </>
  );
}

function CategoryChart({
  ledger,
  month,
  onCategory,
  kind,
}: {
  ledger: Ledger;
  month: string;
  onCategory: (id: string, kind?: Kind) => void;
  kind: Kind;
}) {
  const { palette, s, money, dark } = useAppearance();
  const styles = chartStyles(palette);
  const rows = groups(ledger, month, kind);
  const summary = totals(monthEntries(ledger, month));
  return (
    <>
      <View style={styles.summary}>
        <Text style={s.heading}>Por categoria</Text>
        {rows.length > 0 && (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Distribuição por categoria. Total de ${kind === 'DESPESA' ? 'despesas' : 'receitas'}: ${money(kind === 'DESPESA' ? summary.expense : summary.income)}.`}
            style={{ alignItems: 'center' }}
          >
            <Svg width={220} height={220} accessible={false}>
              <Circle
                cx={110}
                cy={110}
                r={78}
                stroke={palette.track}
                strokeWidth={30}
                fill="none"
              />
              {rows.map((group, index) => {
                const circumference = 2 * Math.PI * 78;
                const offset = rows.slice(0, index).reduce((sum, row) => sum + row.percentage, 0);
                return (
                  <Circle
                    key={group.category.id || 'uncategorized'}
                    cx={110}
                    cy={110}
                    r={78}
                    fill="none"
                    stroke={categoryColor(group.category, dark)}
                    strokeWidth={30}
                    strokeDasharray={`${(circumference * group.percentage) / 100} ${circumference}`}
                    strokeDashoffset={(-circumference * offset) / 100}
                    rotation={-90}
                    origin="110,110"
                  />
                );
              })}
              <SvgText x={110} y={99} textAnchor="middle" fill={palette.muted} fontSize={13}>
                Total
              </SvgText>
              <SvgText
                x={110}
                y={123}
                textAnchor="middle"
                fill={palette.navy}
                fontSize={17}
                fontWeight="700"
              >
                {money(kind === 'DESPESA' ? summary.expense : summary.income)}
              </SvgText>
            </Svg>
          </View>
        )}
        {!rows.length && (
          <Text style={styles.amount}>
            {money(kind === 'DESPESA' ? summary.expense : summary.income)}
          </Text>
        )}

        {rows.length === 0 ? (
          <Empty
            title={`Nenhuma ${kind === 'DESPESA' ? 'despesa' : 'receita'} neste mês`}
            text="Adicione um lançamento no botão + para acompanhar seus grupos."
          />
        ) : (
          <View style={[s.wrap, { alignItems: 'flex-start', gap: 12 }]}>
            {rows.map((g) => (
              <Pressable
                key={g.category.id}
                accessibilityRole="button"
                accessibilityLabel={`${g.category.name}, ${money(g.cents)}, ${percentage(g.percentage)} ${kind === 'DESPESA' ? 'das despesas' : 'das receitas'}. Ver lançamentos.`}
                onPress={() => onCategory(g.category.id, kind)}
                style={({ pressed }) => [
                  styles.category,
                  {
                    flexBasis: '28%',
                    flexGrow: 1,
                    minWidth: 80,
                    borderRadius: 8,
                    backgroundColor: pressed ? palette.selected : 'transparent',
                  },
                ]}
              >
                <View style={s.row}>
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: categoryColor(g.category, dark),
                    }}
                  />
                  <Text style={[s.text, { flex: 1, fontSize: 12, fontWeight: '600' }]}>
                    {g.category.name}
                  </Text>
                </View>
                <View style={[s.wrap, { justifyContent: 'space-between', gap: 4 }]}>
                  <Text style={[s.text, { fontSize: 12, fontWeight: '700' }]}>
                    {money(g.cents)}
                  </Text>
                  <Text style={s.muted}>{percentage(g.percentage)} do total</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      width: `${g.percentage}%`,
                      backgroundColor: categoryColor(g.category, dark),
                    }}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

function MonthlyChart({ ledger, month }: { ledger: Ledger; month: string }) {
  const { palette, s, money } = useAppearance();
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
      <Text style={s.heading}>Últimos 6 meses</Text>
      <Text style={s.muted}>
        Compare o que entrou e saiu. Selecione um mês para ver os valores.
      </Text>
      <View style={s.wrap}>
        <Legend color={palette.income} label="Receitas" />
        <Legend color={palette.expense} label="Despesas" />
      </View>
      {hasData ? (
        <>
          {
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
          }
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
                  pressed && selected !== m.key && { backgroundColor: palette.selected },
                ]}
              >
                <Text
                  style={[
                    s.text,
                    {
                      fontSize: 13,
                      textTransform: 'capitalize',
                      color: selected === m.key ? palette.onAccent : palette.muted,
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
            <Detail label="Receitas" value={`+ ${money(current.income)}`} color={palette.income} />
            <Detail
              label="Despesas"
              value={`− ${money(current.expense)}`}
              color={palette.expense}
            />
            <View style={s.divider} />
            <Detail
              label="Saldo do mês"
              value={money(current.balance)}
              color={current.balance < 0 ? palette.expense : palette.navy}
            />
          </View>
        </>
      ) : (
        <Empty
          title="Sua evolução começa aqui"
          text="Os últimos seis meses vão aparecer conforme você registrar receitas e despesas."
        />
      )}
    </View>
  );
}

function Detail({ label, value, color }: { label: string; value: string; color: string }) {
  const { s } = useAppearance();
  return (
    <View style={[s.wrap, { justifyContent: 'space-between', gap: 4 }]}>
      <Text style={s.text}>{label}</Text>
      <Text style={[s.text, { color, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  const { s } = useAppearance();
  return (
    <View style={s.row}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}
const chartStyles = (palette: Colors) =>
  StyleSheet.create({
    summary: { backgroundColor: palette.card, borderRadius: 20, padding: 16, gap: 8 },
    amount: { color: palette.navy, fontSize: 30, fontWeight: '700' },
    category: { paddingVertical: 8, gap: 8, minHeight: 48, minWidth: 48 },
    track: { height: 8, backgroundColor: palette.track, borderRadius: 4, overflow: 'hidden' },
    disclosure: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
    month: {
      paddingHorizontal: 10,
      paddingVertical: 12,
      borderRadius: 12,
      minHeight: 48,
      minWidth: '28%',
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: palette.background,
    },
    selectedMonth: {
      backgroundColor: palette.accent,
      borderWidth: 1,
      borderColor: palette.accent,
    },
    monthDetails: { backgroundColor: palette.background, borderRadius: 16, padding: 16, gap: 12 },
  });
