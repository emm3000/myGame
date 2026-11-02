plugins {
    id("mygame.android.library")
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:projection"))

    api(libs.junit)
    api(libs.kotlinx.coroutines.test)
}
