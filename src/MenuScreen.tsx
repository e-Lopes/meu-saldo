import React, { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Ledger } from './finance';
import { Button, palette, s } from './ui';

type Props = {
  ledger: Ledger | null;
  version: string;
  busy: boolean;
  loading: boolean;
  backupBusy: boolean;
  updateVersion?: string;
  updateContent: ReactNode;
  onCategories: () => void;
  onExport: () => void;
  onImport: () => void;
};
export function MenuScreen({
  ledger,
  version,
  busy,
  loading,
  backupBusy,
  updateVersion,
  updateContent,
  onCategories,
  onExport,
  onImport,
}: Props) {
  const [privacy, setPrivacy] = useState(false);
  const [backup, setBackup] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [help, setHelp] = useState(false);
  const [about, setAbout] = useState(false);
  useEffect(() => {
    if (updateVersion) setUpdates(true);
  }, [updateVersion]);
  useEffect(() => {
    if (!ledger && !loading) setBackup(true);
  }, [ledger, loading]);
  const showBackup = backup;
  return (
    <>
      <LinearGradient colors={['#17304F', '#215761']} style={styles.privacy}>
        <View style={s.row}>
          <View style={styles.shield}>
            <Ionicons name="shield-checkmark-outline" size={30} color="#A4E3D6" />
          </View>
          <Text style={styles.privacyTitle}>Seus dados são seus</Text>
        </View>
        <Text style={styles.privacyText}>
          Suas finanças ficam somente neste celular. Você cuida do seu dinheiro, a gente respeita
          sua privacidade.
        </Text>
        <View style={s.wrap}>
          {['Sem conta', 'Sem anúncios', 'Uso offline'].map((label) => (
            <View key={label} style={styles.badge}>
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: privacy }}
          onPress={() => setPrivacy((v) => !v)}
          style={styles.privacyAction}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14, flex: 1 }}>
            Entenda sua privacidade
          </Text>
          <Ionicons name={privacy ? 'chevron-up' : 'chevron-down'} size={18} color="white" />
        </Pressable>
        {privacy && (
          <View style={{ gap: 10 }}>
            <Text style={styles.privacyText}>
              Nenhum lançamento, categoria ou saldo é enviado. Sem banco de dados, sincronização ou
              rastreamento.
            </Text>
            <Text style={styles.privacyText}>
              A internet é usada apenas para buscar versões e baixar atualizações. O GitHub recebe
              dados normais dessas requisições, como IP e versão do app.
            </Text>
            <Text style={styles.privacyText}>
              Não há backup automático na nuvem. Se desinstalar ou limpar os dados, você precisará
              de uma cópia de segurança para recuperar os registros.
            </Text>
          </View>
        )}
      </LinearGradient>
      <View style={s.card}>
        <Text style={s.heading}>Do seu jeito</Text>
        <MenuRow
          icon="grid-outline"
          title="Categorias"
          subtitle="Organize seus gastos por nome, cor e ícone"
          disabled={!ledger || busy}
          onPress={onCategories}
        />
        <View style={s.divider} />
        <MenuRow
          icon="help-circle-outline"
          title="Como usar"
          subtitle="Dicas rápidas para o dia a dia"
          expanded={help}
          onPress={() => setHelp((v) => !v)}
        />
        {help && (
          <View style={styles.inset}>
            <Tip
              title="Registre no botão +"
              text="Escolha receita ou despesa, informe o valor e a data. Despesas precisam de uma categoria."
            />
            <Tip
              title="Explore seu mês"
              text="Use as setas para trocar o mês. Seu saldo é o que entrou menos o que saiu nesse período."
            />
            <Tip
              title="Encontre um lançamento"
              text="Busque pela descrição no Histórico. Toque no registro para editar ou excluir."
            />
            <Tip
              title="Entenda seus gastos"
              text="Nos Gráficos, toque em uma categoria para abrir seus lançamentos ou compare os últimos seis meses."
            />
          </View>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Cuide do aplicativo</Text>
        <MenuRow
          icon="refresh-outline"
          title="Atualizações"
          subtitle={
            updateVersion
              ? `Versão ${updateVersion} disponível`
              : `Você está usando a versão ${version}`
          }
          expanded={updates}
          highlight={!!updateVersion}
          onPress={() => setUpdates((v) => !v)}
        />
        {updates && updateContent}
        <View style={s.divider} />
        <MenuRow
          icon="download-outline"
          title="Cópia de segurança"
          subtitle="Salve ou recupere seus registros"
          expanded={showBackup}
          onPress={() => setBackup((v) => !v)}
        />
        {showBackup && (
          <View style={styles.inset}>
            <Text style={s.muted}>
              Guarde uma cópia antes de trocar de celular ou desinstalar o app. O arquivo não é
              criptografado; escolha um lugar seguro.
            </Text>
            <Button
              secondary
              title={backupBusy ? 'Aguarde…' : 'Salvar uma cópia'}
              disabled={!ledger || backupBusy || busy}
              onPress={onExport}
            />
            <Button
              secondary
              title="Restaurar uma cópia"
              disabled={loading || backupBusy || busy}
              onPress={onImport}
            />
            <Text style={[s.muted, { fontSize: 12 }]}>
              A restauração só substitui os registros depois da sua confirmação.
            </Text>
          </View>
        )}
        <View style={s.divider} />
        <MenuRow
          icon="information-circle-outline"
          title="Sobre o Meu Saldo"
          subtitle="Gratuito e feito para simplificar"
          expanded={about}
          onPress={() => setAbout((v) => !v)}
        />
        {about && (
          <View style={styles.inset}>
            <Text style={s.text}>Meu Saldo {version} · Android</Text>
            <Text style={s.muted}>
              Cada celular tem seus próprios registros. Você pode compartilhar o APK com amigos e
              família sem compartilhar suas finanças.
            </Text>
            {ledger && (
              <Text style={s.muted}>
                {ledger.entries.length} lançamentos ·{' '}
                {ledger.categories.filter((c) => !c.archived).length} categorias ativas neste
                celular
              </Text>
            )}
          </View>
        )}
      </View>
      <Text style={[s.muted, { textAlign: 'center', fontSize: 12 }]}>
        Meu Saldo · simples, local e seu.
      </Text>
    </>
  );
}
function Tip({ title, text }: { title: string; text: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[s.text, { fontWeight: '600' }]}>{title}</Text>
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}
function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  expanded,
  disabled,
  highlight,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  expanded?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, ...(expanded !== undefined ? { expanded } : {}) }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.menuRow, { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 }]}
    >
      <View style={[styles.menuIcon, highlight && { backgroundColor: '#D7EDE7' }]}>
        <Ionicons name={icon} size={23} color={palette.teal} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.text, { fontWeight: '600' }]}>
          {title}
          {highlight ? ' · nova versão' : ''}
        </Text>
        <Text style={[s.muted, { fontSize: 13 }]}>{subtitle}</Text>
      </View>
      <Ionicons
        name={expanded === undefined ? 'chevron-forward' : expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={palette.muted}
      />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  privacy: { padding: 22, borderRadius: 22, gap: 16 },
  shield: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: { color: 'white', fontSize: 23, fontWeight: '700', flex: 1 },
  privacyText: { color: '#DCECEB', fontSize: 14, lineHeight: 22 },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF15',
  },
  badgeText: { color: '#C1EBE1', fontSize: 12, fontWeight: '600' },
  privacyAction: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  menuRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    minHeight: 66,
    paddingVertical: 8,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inset: { backgroundColor: '#F3F6F8', borderRadius: 16, padding: 16, gap: 14 },
});
