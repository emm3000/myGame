plugins {
    id("mygame.jvm.library")
}

dependencies {
    implementation(project(":core:model"))
    implementation(project(":core:projection"))

    api(libs.junit)
    api(libs.kotlinx.coroutines.test)
}
