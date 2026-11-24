plugins {
    id("mygame.jvm.library")
    alias(libs.plugins.kotlin.serialization)
}

dependencies {
    implementation(libs.kotlinx.serialization.core)
    api(libs.kotlinx.coroutines.core)
}
