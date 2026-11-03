plugins {
    id("mygame.android.application")
    alias(libs.plugins.kotlin.serialization)
}

fun releaseSetting(property: String, variable: String): Provider<String> =
    providers.gradleProperty("mygame.release.$property")
        .orElse(providers.environmentVariable("MYGAME_RELEASE_$variable"))

val releaseStoreFile: Provider<String> = releaseSetting("storeFile", "STORE_FILE")
val releaseStorePassword: Provider<String> = releaseSetting("storePassword", "STORE_PASSWORD")
val releaseKeyAlias: Provider<String> = releaseSetting("keyAlias", "KEY_ALIAS")
val releaseKeyPassword: Provider<String> = releaseSetting("keyPassword", "KEY_PASSWORD")
val releaseSettings: List<Provider<String>> =
    listOf(releaseStoreFile, releaseStorePassword, releaseKeyAlias, releaseKeyPassword)
val isReleaseSigned: Boolean = releaseSettings.all { it.isPresent }

if (!isReleaseSigned && releaseSettings.any { it.isPresent }) {
    error(
        "Release signing needs all four of mygame.release.storeFile, storePassword, keyAlias and keyPassword " +
            "(or MYGAME_RELEASE_STORE_FILE, _STORE_PASSWORD, _KEY_ALIAS and _KEY_PASSWORD); some are missing.",
    )
}

val localApiBaseUrl: String = providers.gradleProperty("mygame.apiBaseUrl").orElse("http://10.0.2.2:3141/").get()

android {
    namespace = "com.emm.mygame"

    defaultConfig {
        applicationId = "com.emm.mygame"
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (isReleaseSigned) {
            create("release") {
                storeFile = file(releaseStoreFile.get())
                storePassword = releaseStorePassword.get()
                keyAlias = releaseKeyAlias.get()
                keyPassword = releaseKeyPassword.get()
            }
        }
    }

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"$localApiBaseUrl\"")
        }
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.findByName("release")
            buildConfigField("String", "API_BASE_URL", "\"https://mygame.emm3000.com/api/\"")
        }
        create("localRelease") {
            initWith(getByName("release"))
            matchingFallbacks += "release"
            applicationIdSuffix = ".local"
            buildConfigField("String", "API_BASE_URL", "\"$localApiBaseUrl\"")
        }
    }

    sourceSets {
        getByName("localRelease") {
            manifest.srcFile("src/debug/AndroidManifest.xml")
            res.srcDir("src/debug/res")
        }
    }
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:projection"))
    implementation(project(":core:designsystem"))
    implementation(project(":core:ui"))
    implementation(project(":feature:chronicle"))
    implementation(project(":feature:fief"))
    implementation(project(":feature:map"))
    implementation(project(":feature:signin"))

    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.navigation3.runtime)
    implementation(libs.androidx.navigation3.ui)
    implementation(libs.androidx.lifecycle.viewmodel.navigation3)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.kotlinx.serialization.core)
    implementation(libs.kotlinx.coroutines.core)

    testImplementation(project(":core:testing"))
    testImplementation(libs.kotlinx.serialization.json)
}
