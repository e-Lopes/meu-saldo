const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const signing = `
// Meu Saldo: keep the original release key outside version control.
def saldoProperties = new Properties()
def saldoRoot = rootProject.projectDir.parentFile
def saldoPropertiesFile = new File(saldoRoot, 'keystore.properties')
if (saldoPropertiesFile.exists()) {
    saldoPropertiesFile.withInputStream { saldoProperties.load(it) }
    android.signingConfigs.create('meuSaldoRelease') {
        storeFile new File(saldoRoot, saldoProperties.getProperty('storeFile'))
        storePassword saldoProperties.getProperty('storePassword')
        keyAlias saldoProperties.getProperty('keyAlias')
        keyPassword saldoProperties.getProperty('keyPassword')
    }
    android.buildTypes.release.signingConfig = android.signingConfigs.meuSaldoRelease
} else {
    android.buildTypes.release.signingConfig = null
    gradle.taskGraph.whenReady { graph ->
        if (graph.allTasks.any { it.name.toLowerCase().contains('release') }) {
            throw new GradleException('Configure keystore.properties with the original Meu Saldo key before building a release.')
        }
    }
}
`;
module.exports = function withMeuSaldo(config) {
  config = withAndroidManifest(config, (c) => {
    const application = c.modResults.manifest.application[0];
    application.$['android:allowBackup'] = 'false';
    application.$['android:fullBackupContent'] = 'false';
    application.$['android:dataExtractionRules'] = '@xml/meu_saldo_data_extraction_rules';
    application.$['android:usesCleartextTraffic'] = 'false';
    application.$['android:icon'] = '@drawable/meu_saldo_wallet';
    application.$['android:roundIcon'] = '@drawable/meu_saldo_wallet';
    return c;
  });
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('// Meu Saldo: keep the original release key'))
      c.modResults.contents += signing;
    return c;
  });
  return withDangerousMod(config, [
    'android',
    (c) => {
      const res = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res');
      fs.mkdirSync(path.join(res, 'xml'), { recursive: true });
      fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
      fs.writeFileSync(
        path.join(res, 'xml/meu_saldo_data_extraction_rules.xml'),
        '<data-extraction-rules>' +
          ['cloud-backup', 'device-transfer']
            .map(
              (type) =>
                '<' +
                type +
                '>' +
                ['root', 'file', 'database', 'sharedpref', 'external']
                  .map((domain) => '<exclude domain="' + domain + '" path="."/>')
                  .join('') +
                '</' +
                type +
                '>',
            )
            .join('') +
          '</data-extraction-rules>',
      );
      fs.writeFileSync(
        path.join(res, 'drawable/meu_saldo_wallet.xml'),
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="48dp" android:height="48dp" android:viewportWidth="48" android:viewportHeight="48"><path android:fillColor="#17304F" android:pathData="M0,0h48v48h-48z"/><path android:fillColor="#53AAA5" android:pathData="M8,12h30v24h-30z"/><path android:fillColor="#FFFFFF" android:pathData="M28,20h13v9h-13z"/><path android:fillColor="#17304F" android:pathData="M31,23h3v3h-3z"/></vector>',
      );
      return c;
    },
  ]);
};
