plugins {
    id("mygame.android.application")
    alias(libs.plugins.kotlin.serialization)
}

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

    buildTypes {
        debug {
            val debugApiBaseUrl: String =
                providers.gradleProperty("mygame.apiBaseUrl").orElse("http://10.0.2.2:3141/").get()
            buildConfigField("String", "API_BASE_URL", "\"$debugApiBaseUrl\"")
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://mygame.emm3000.com/api/\"")
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
    implementation(project(":feature:signin"))

    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.navigation3.runtime)
    implementation(libs.androidx.navigation3.ui)
    implementation(libs.androidx.lifecycle.viewmodel.navigation3)
    implementation(libs.kotlinx.serialization.core)
    implementation(libs.kotlinx.coroutines.core)

    testImplementation(project(":core:testing"))
}
