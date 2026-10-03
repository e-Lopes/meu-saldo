import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAppearance } from './Appearance';
import { MenuRow } from './MenuRow';
import { Button, Card, IconButton } from './ui';
import { useUpdates } from './useUpdates';
type Updates = ReturnType<typeof useUpdates>;
type Props = { updates: Updates } & (
  { settings: true; onOpenSettings?: never } | { settings?: false; onOpenSettings: () => void }
);

export function UpdateCard({ updates, settings, onOpenSettings }: Props) {
  const { palette, s } = useAppearance();
  const [showNotes, setShowNotes] = useState(false);
  if (!settings && (!updates.release || updates.dismissed)) return null;
  if (!settings)
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <MenuRow
            icon="refresh-outline"
            title="Atualização disponível"
            subtitle={`Versão ${updates.release!.versionName}`}
            onPress={onOpenSettings}
          />
        </View>
        <IconButton icon="close" label="Dispensar aviso de atualização" onPress={updates.dismiss} />
      </Card>
    );
  return (
    <Card style={{ backgroundColor: palette.selected }}>
      {updates.release && (
        <>
          <Text style={s.text}>A atualização mantém seus registros neste celular.</Text>
          {!!updates.release.notes && (
            <>
              <MenuRow
                icon="list-outline"
                title="O que mudou"
                expanded={showNotes}
                onPress={() => setShowNotes((value) => !value)}
              />
              {showNotes && <Text style={s.muted}>{updates.release.notes}</Text>}
            </>
          )}
        </>
      )}
      {updates.checking && <ActivityIndicator color={palette.teal} />}
      {updates.downloading ? (
        <>
          <View
            style={{
              height: 8,
              backgroundColor: palette.track,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 8,
                width: `${Math.round(updates.progress * 100)}%`,
                backgroundColor: palette.teal,
              }}
            />
          </View>
          <Text style={s.muted}>Baixando {Math.round(updates.progress * 100)}%</Text>
          <Button secondary title="Cancelar download" onPress={updates.cancel} />
        </>
      ) : (
        <>
          {updates.release && (
            <Button
              title={
                updates.installing
                  ? 'Abrindo instalador…'
                  : updates.ready
                    ? 'Instalar atualização'
                    : 'Baixar e atualizar'
              }
              onPress={() => void updates.update()}
              disabled={updates.checking || updates.installing}
            />
          )}
          <Button
            secondary
            title={updates.checking ? 'Verificando…' : 'Verificar atualizações'}
            onPress={() => void updates.check(true)}
            disabled={updates.checking || updates.installing}
          />
        </>
      )}
      {!!updates.message && <Text style={s.muted}>{updates.message}</Text>}
      <Text style={s.muted}>O aplicativo continua funcionando sem conexão.</Text>
    </Card>
  );
}
