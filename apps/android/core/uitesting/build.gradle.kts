plugins {
    id("mygame.android.library")
}

dependencies {
    implementation(project(":core:designsystem"))

    api(platform(libs.androidx.compose.bom))
    api(libs.androidx.compose.ui.test.junit4)
}
