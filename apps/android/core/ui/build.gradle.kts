plugins {
    id("mygame.android.compose")
}

android {
    testOptions.unitTests.isIncludeAndroidResources = true
}

dependencies {
    implementation(project(":core:projection"))
    implementation(project(":core:designsystem"))

    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
