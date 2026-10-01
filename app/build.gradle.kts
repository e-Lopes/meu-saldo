import java.util.Properties
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}
val signing = Properties().apply { rootProject.file("keystore.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) } }
android {
    namespace = "br.com.meusaldo"
    compileSdk = 35
    defaultConfig {
        applicationId = "br.com.meusaldo"; minSdk = 26; targetSdk = 35; versionCode = 3; versionName = "1.2.0"
        buildConfigField("String", "UPDATE_URL", "\"https://github.com/e-Lopes/meu-saldo/releases/latest/download/update.json\"")
    }
    if (signing.isNotEmpty()) signingConfigs.create("localRelease") {
        storeFile = rootProject.file(signing.getProperty("storeFile")); storePassword = signing.getProperty("storePassword")
        keyAlias = signing.getProperty("keyAlias"); keyPassword = signing.getProperty("keyPassword")
    }
    buildTypes { release { if (signing.isNotEmpty()) signingConfig = signingConfigs.getByName("localRelease") } }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    testOptions { unitTests.isReturnDefaultValues = true }
}
dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.04.01"))
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
}
