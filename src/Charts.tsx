import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { categoryColor, groups, Ledger, money, monthEntries, shiftMonth, totals } from './finance';
import { Empty, palette, s } from './ui';

export function Charts({ ledger, month }: { ledger: Ledger; month: string }) {
  const rows = groups(ledger, month);
  const [width, setWidth] = useState(280);
  const months = Array.from({ length: 6 }, (_, i) => {
    const key = shiftMonth(month, i - 5);
    return { key, ...totals(monthEntries(ledger, key)) };
  });
  const maximum = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const maxExpense = Math.max(1, ...rows.map((g) => g.cents));
  const chartWidth = Math.max(80, width - 24);
  return (
    <>
      <View style={s.card} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 36)}>
        <Text style={s.heading}>Onde você mais gastou</Text>
        <Text style={s.muted}>
          Barras: despesas por categoria. Linha: percentual acumulado dos gastos, em ordem
          decrescente.
        </Text>
        {rows.length === 0 ? (
          <Empty
            title="Nenhuma despesa neste mês"
            text="Os gráficos aparecem quando você registrar despesas."
          />
        ) : (
          <>
            <Svg width={width} height={180} accessible={false}>
              {[0, 50, 100].map((p) => (
                <Line
                  key={p}
                  x1={12}
                  x2={chartWidth + 12}
                  y1={160 - p * 1.4}
                  y2={160 - p * 1.4}
                  stroke={palette.border}
                />
              ))}
              {rows.map((g, i) => {
                const step = chartWidth / rows.length;
                const barWidth = Math.min(42, step * 0.65);
                return (
                  <Rect
                    key={g.category.id}
                    x={12 + step * (i + 0.5) - barWidth / 2}
                    y={160 - (g.cents / maxExpense) * 140}
                    width={barWidth}
                    height={(g.cents / maxExpense) * 140}
                    fill={categoryColor(g.category.color)}
                    rx={4}
                  />
                );
              })}
              <Polyline
                points={rows
                  .map(
                    (g, i) =>
                      `${12 + (chartWidth / rows.length) * (i + 0.5)},${160 - g.cumulative * 1.4}`,
                  )
                  .join(' ')}
                stroke={palette.navy}
                strokeWidth={2.5}
                fill="none"
              />
              {rows.map((g, i) => (
                <Circle
                  key={g.category.id}
                  cx={12 + (chartWidth / rows.length) * (i + 0.5)}
                  cy={160 - g.cumulative * 1.4}
                  r={4}
                  fill={palette.navy}
                />
              ))}
            </Svg>
            {rows.map((g, i) => (
              <View key={g.category.id} style={{ gap: 4 }}>
                <View style={s.row}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: categoryColor(g.category.color),
                    }}
                  />
                  <Text style={[s.text, { flex: 1 }]}>
                    {i + 1}. {g.category.name}
                  </Text>
                  <Text style={[s.text, { fontWeight: '600' }]}>{money(g.cents)}</Text>
                </View>
                <Text style={s.muted}>
                  {g.percentage.toFixed(1).replace('.', ',')}% das despesas · acumulado{' '}
                  {g.cumulative.toFixed(1).replace('.', ',')}%
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Últimos seis meses</Text>
        <View style={s.wrap}>
          <Text style={[s.text, { color: palette.income }]}>● Receitas</Text>
          <Text style={[s.text, { color: palette.expense }]}>● Despesas</Text>
        </View>
        <Svg width={width} height={155} accessible={false}>
          <Line x1={0} x2={width} y1={150} y2={150} stroke={palette.border} />
          {months.map((m, i) => {
            const step = width / 6;
            const bar = Math.min(14, step / 4);
            return (
              <React.Fragment key={m.key}>
                <Rect
                  x={step * (i + 0.5) - bar - 2}
                  y={150 - (m.income / maximum) * 135}
                  width={bar}
                  height={(m.income / maximum) * 135}
                  rx={3}
                  fill={palette.income}
                />
                <Rect
                  x={step * (i + 0.5) + 2}
                  y={150 - (m.expense / maximum) * 135}
                  width={bar}
                  height={(m.expense / maximum) * 135}
                  rx={3}
                  fill={palette.expense}
                />
              </React.Fragment>
            );
          })}
        </Svg>
        <View style={{ flexDirection: 'row', width }}>
          {months.map((m) => (
            <Text
              key={m.key}
              style={[s.muted, { width: width / 6, textAlign: 'center', fontSize: 11 }]}
            >
              {m.key.slice(5)}/{m.key.slice(2, 4)}
            </Text>
          ))}
        </View>
        {months.map((m) => (
          <View key={m.key} style={{ gap: 3 }}>
            <Text style={[s.text, { fontWeight: '600' }]}>
              {m.key.slice(5)}/{m.key.slice(0, 4)}
            </Text>
            <Text style={s.muted}>
              Receitas {money(m.income)} · despesas {money(m.expense)} · saldo {money(m.balance)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
