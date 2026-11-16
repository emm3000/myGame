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
}
