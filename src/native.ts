import { NativeModule, requireNativeModule } from 'expo-modules-core';
export type Release = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  sha256: string;
  sizeBytes: number;
  minSdk: number;
  notes: string;
};
type NativeEvents = { updateProgress: (event: { progress: number }) => void };
declare class SaldoModule extends NativeModule<NativeEvents> {
  versionName: string;
  readLedger(): Promise<string | null>;
  writeLedger(text: string): Promise<void>;
  exportBackup(text: string, name: string): Promise<boolean>;
  importBackup(): Promise<string | null>;
  checkUpdate(manual: boolean): Promise<{ release: Release | null; message: string }>;
  cachedUpdate(): Promise<Release | null>;
  downloadUpdate(text: string): Promise<void>;
  cancelDownload(): void;
  installUpdate(text: string): Promise<'permission' | 'installer'>;
  openInstallPermission(): Promise<void>;
}
export default requireNativeModule<SaldoModule>('MeuSaldoNative');
