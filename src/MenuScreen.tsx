import { ReactNode, useState } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppearance } from './Appearance';
import { Ledger } from './finance';
import { MenuRow } from './MenuRow';
import { Card, SectionHeader } from './ui';

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
  const { palette, s, lastBackup } = useAppearance();
  const [showUpdates, setShowUpdates] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const reminder =
    !!ledger?.entries.length && (!lastBackup || Date.now() - lastBackup > 14 * 86400000);
  return (
    <>
      <SectionHeader>Organização</SectionHeader>
      <Card>
        <MenuRow
          icon="grid-outline"
          title="Categorias"
          subtitle="Organize receitas e despesas"
          disabled={!ledger || busy}
          onPress={onCategories}
        />
      </Card>
      <SectionHeader>Dados e backup</SectionHeader>
      <Card>
        <MenuRow
          icon="share-outline"
          title="Exportar backup"
          subtitle="Salvar uma cópia dos seus dados"
          disabled={!ledger || busy || backupBusy}
          onPress={onExport}
        />
        <View style={s.divider} />
        <MenuRow
          icon="refresh-outline"
          title="Restaurar backup"
          subtitle="Recuperar dados de um arquivo"
          disabled={loading || busy || backupBusy}
          onPress={onImport}
        />
        <View style={s.divider} />
        {reminder && (
          <Text style={{ color: palette.warning, fontSize: 14 }}>
            Você ainda não exportou uma cópia recente.
          </Text>
        )}
        {!!lastBackup && (
          <Text style={s.muted}>
            Última exportação: {new Date(lastBackup).toLocaleString('pt-BR')}.
          </Text>
        )}
        <Text style={s.muted}>Restaurar substitui os registros atuais após confirmação.</Text>
      </Card>
      <SectionHeader>Sobre o app</SectionHeader>
      <Card>
        <MenuRow
          icon="download-outline"
          title="Atualizações"
          subtitle={
            updateVersion
              ? `Versão ${updateVersion} disponível`
              : 'Buscar uma nova versão do aplicativo'
          }
          expanded={showUpdates}
          onPress={() => setShowUpdates((value) => !value)}
        />
        {showUpdates && updateContent}
        <View style={s.divider} />
        <View style={[s.row, { minHeight: 48 }]}>
          <Ionicons name="information-circle-outline" size={24} color={palette.muted} />
          <Text style={[s.text, { flex: 1 }]}>Versão instalada</Text>
          <Text style={s.muted}>{version}</Text>
        </View>
        <View style={s.divider} />
        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacidade"
          expanded={showPrivacy}
          onPress={() => setShowPrivacy((value) => !value)}
        />
        {showPrivacy && (
          <View style={{ gap: 8 }}>
            <View style={s.row}>
              <Ionicons name="shield-checkmark-outline" size={20} color={palette.muted} />
              <Text style={[s.muted, { flex: 1 }]}>
                Seus dados ficam apenas neste celular. Exporte um backup para recuperá-los ao trocar
                de aparelho ou reinstalar o app.
              </Text>
            </View>

            <Text style={s.muted}>
              Sem cadastro, anúncios ou envio de registros financeiros. Não há sincronização
              automática na nuvem.
            </Text>
            <Text style={s.muted}>
              A internet é usada para atualizações pelo GitHub. Os backups exportados não têm senha.
            </Text>
          </View>
        )}
      </Card>
      <Text style={[s.muted, { textAlign: 'center' }]}>Offline · Sem cadastro · Sem anúncios</Text>
    </>
  );
}
