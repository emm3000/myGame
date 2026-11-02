plugins {
    id("mygame.android.application")
}

android {
    namespace = "com.emm.mygame"

    defaultConfig {
        applicationId = "com.emm.mygame"
        versionCode = 1
        versionName = "0.1.0"
    }
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:projection"))
    implementation(project(":core:designsystem"))
    implementation(project(":core:ui"))

    implementation(libs.androidx.activity.compose)

    testImplementation(project(":core:testing"))
}
