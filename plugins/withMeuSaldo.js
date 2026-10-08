const {
  withAndroidManifest,
  withAppBuildGradle,
  withAndroidStyles,
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
  config = withAndroidStyles(config, (c) => {
    const styles = c.modResults.resources.style;
    const splash = styles.find((style) => style.$.name === 'Theme.App.SplashScreen');
    if (splash) {
      splash.item = (splash.item || []).filter(
        (item) => item.$.name !== 'android:windowBackground',
      );
      splash.item.push({
        $: { name: 'android:windowBackground' },
        _: '@drawable/meu_saldo_splash',
      });
    }
    return c;
  });
  config = withAndroidManifest(config, (c) => {
    const application = c.modResults.manifest.application[0];
    application.$['android:allowBackup'] = 'false';
    application.$['android:fullBackupContent'] = 'false';
    application.$['android:dataExtractionRules'] = '@xml/meu_saldo_data_extraction_rules';
    application.$['android:usesCleartextTraffic'] = 'false';
    application.$['android:icon'] = '@drawable/meu_saldo_app_icon';
    application.$['android:roundIcon'] = '@drawable/meu_saldo_app_icon';
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
      fs.mkdirSync(path.join(res, 'drawable-nodpi'), { recursive: true });
      fs.copyFileSync(
        path.join(c.modRequest.projectRoot, 'assets/icon.png'),
        path.join(res, 'drawable-nodpi/meu_saldo_app_icon.png'),
      );
      fs.mkdirSync(path.join(res, 'values-v31'), { recursive: true });
      fs.writeFileSync(
        path.join(res, 'drawable/meu_saldo_splash.xml'),
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/meu_saldo_splash_background"/><item android:width="96dp" android:height="96dp" android:gravity="center" android:drawable="@drawable/meu_saldo_app_icon"/></layer-list>',
      );
      fs.writeFileSync(
        path.join(res, 'values/meu_saldo_splash.xml'),
        '<resources><color name="meu_saldo_splash_background">#0D1B2A</color></resources>',
      );
      fs.writeFileSync(
        path.join(res, 'values-v31/meu_saldo_splash.xml'),
        '<resources><style name="Theme.App.SplashScreen" parent="AppTheme"><item name="android:windowSplashScreenBackground">@color/meu_saldo_splash_background</item><item name="android:windowSplashScreenAnimatedIcon">@drawable/meu_saldo_app_icon</item><item name="android:windowSplashScreenIconBackgroundColor">@color/meu_saldo_splash_background</item><item name="android:windowBackground">@drawable/meu_saldo_splash</item></style></resources>',
      );
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
      return c;
    },
  ]);
};
