plugins {
    id("mygame.android.compose")
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:designsystem"))

    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    testImplementation(project(":core:testing"))
}
