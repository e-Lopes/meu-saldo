import { ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from './Appearance';
import { Ledger } from './finance';
import { MenuRow } from './MenuRow';
import { Button, Card, SegmentedControl } from './ui';
import { radius, spacing } from './theme/tokens';

type Section = 'appearance' | 'backup' | 'updates' | 'help' | 'privacy';
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
  const { palette, s, theme, setTheme, saving, lastBackup } = useAppearance();
  const [section, setSection] = useState<Section | null>(null);
  const unavailable = ledger === null;
  useEffect(() => {
    if (unavailable && !loading) setSection('backup');
    else if (updateVersion) setSection('updates');
  }, [unavailable, loading, updateVersion]);
  const toggle = (next: Section) => setSection((previous) => (previous === next ? null : next));
  const reminder =
    !!ledger?.entries.length && (!lastBackup || Date.now() - lastBackup > 14 * 86400000);
  const detail = {
    backgroundColor: palette.background,
    borderRadius: radius.control,
    padding: spacing.lg,
    gap: spacing.md,
  };
  return (
    <>
      <Card>
        <MenuRow
          icon="grid-outline"
          title="Categorias"
          subtitle="Organize suas despesas"
          disabled={!ledger || busy}
          onPress={onCategories}
        />
        <View style={s.divider} />
        <MenuRow
          icon="color-palette-outline"
          title="Aparência"
          subtitle={
            { system: 'Acompanhar o celular', light: 'Tema claro', dark: 'Tema escuro' }[theme]
          }
          expanded={section === 'appearance'}
          onPress={() => toggle('appearance')}
        />
        {section === 'appearance' && (
          <View style={detail}>
            <SegmentedControl
              label="Tema do aplicativo"
              value={theme}
              disabled={saving}
              onChange={(value) => void setTheme(value)}
              options={[
                { value: 'system', label: 'Sistema' },
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
              ]}
            />
          </View>
        )}
      </Card>
      <Card>
        <MenuRow
          icon="download-outline"
          title="Cópia de segurança"
          subtitle={
            reminder
              ? 'Salve uma cópia dos seus registros'
              : lastBackup
                ? `Última cópia: ${new Date(lastBackup).toLocaleDateString('pt-BR')}`
                : 'Salvar ou recuperar registros'
          }
          expanded={section === 'backup'}
          highlight={reminder}
          onPress={() => toggle('backup')}
        />
        {section === 'backup' && (
          <View style={detail}>
            <Text style={s.muted}>
              Salve uma cópia antes de trocar de celular ou desinstalar o app.
            </Text>
            <Button
              title={backupBusy ? 'Aguarde…' : 'Salvar uma cópia'}
              onPress={onExport}
              disabled={!ledger || backupBusy || busy}
            />
            <Button
              secondary
              title="Restaurar uma cópia"
              onPress={onImport}
              disabled={loading || backupBusy || busy}
            />
            <Text style={s.muted}>
              A restauração pede confirmação antes de substituir seus registros.
            </Text>
            {!!lastBackup && (
              <Text style={s.muted}>
                Última cópia salva em {new Date(lastBackup).toLocaleString('pt-BR')}. Confira se o
                arquivo continua guardado.
              </Text>
            )}
          </View>
        )}
        <View style={s.divider} />
        <MenuRow
          icon="refresh-outline"
          title="Atualizações"
          subtitle={
            updateVersion ? `Versão ${updateVersion} disponível` : `Versão instalada: ${version}`
          }
          expanded={section === 'updates'}
          highlight={!!updateVersion}
          onPress={() => toggle('updates')}
        />
        {section === 'updates' && updateContent}
      </Card>
      <Card>
        <MenuRow
          icon="help-circle-outline"
          title="Como usar"
          expanded={section === 'help'}
          onPress={() => toggle('help')}
        />
        {section === 'help' && (
          <View style={detail}>
            <Text style={s.text}>1. Toque em + para registrar uma receita ou despesa.</Text>
            <Text style={s.text}>2. Escolha o mês para consultar saldo, histórico e gráficos.</Text>
            <Text style={s.text}>
              3. Toque em um lançamento no Histórico para editar ou excluir.
            </Text>
            <Text style={s.text}>4. Salve uma cópia dos registros regularmente.</Text>
            <Text style={s.muted}>
              O saldo mostra as receitas menos as despesas do mês, sem somar meses anteriores.
            </Text>
          </View>
        )}
        <View style={s.divider} />
        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacidade"
          subtitle="Seus registros ficam neste celular"
          expanded={section === 'privacy'}
          onPress={() => toggle('privacy')}
        />
        {section === 'privacy' && (
          <View style={detail}>
            <Text style={s.text}>
              Sem conta, anúncios ou envio de registros financeiros. Cada celular tem seus próprios
              dados.
            </Text>
            <Text style={s.muted}>
              A internet é usada para verificar e baixar atualizações. O GitHub recebe dados dessas
              requisições, como IP e versão do app.
            </Text>
            <Text style={s.muted}>
              Não há cópia automática na nuvem. Desinstalar ou limpar os dados apaga os registros
              deste celular.
            </Text>
            <Text style={s.muted}>
              Os arquivos de cópia não são criptografados. Guarde-os em um lugar seguro. Ocultar
              valores protege a tela, sem criptografar os arquivos.
            </Text>
            <Text style={s.muted}>
              Você pode compartilhar o aplicativo com amigos e familiares sem compartilhar suas
              finanças.
            </Text>
          </View>
        )}
      </Card>
      <Text style={[s.muted, { textAlign: 'center' }]}>Meu Saldo {version} · Uso offline</Text>
    </>
  );
}
