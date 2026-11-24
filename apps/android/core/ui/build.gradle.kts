plugins {
    id("mygame.android.compose")
}

android {
    testOptions.unitTests.isIncludeAndroidResources = true
    testFixtures.enable = true
}

dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:projection"))
    implementation(project(":core:designsystem"))

    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    testFixturesImplementation(project(":core:designsystem"))
    testFixturesImplementation(platform(libs.androidx.compose.bom))
    testFixturesImplementation(libs.androidx.compose.foundation)
    testFixturesImplementation(libs.androidx.compose.ui.test.junit4)
    testFixturesImplementation(libs.junit)
}
