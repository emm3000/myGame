plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.detekt)
    id("mygame.module.checks")
}

allprojects {
    apply(plugin = "io.gitlab.arturbosch.detekt")

    detekt {
        toolVersion = rootProject.libs.versions.detekt.get()
        config.setFrom(rootProject.files("config/detekt/detekt.yml"))
        buildUponDefaultConfig = true
        parallel = true
        basePath = rootDir.absolutePath
    }

    dependencies {
        detektPlugins(rootProject.libs.detekt.formatting)
        detektPlugins(rootProject.libs.detekt.compose.rules)
    }
}

detekt {
    source.setFrom(files("build-logic/convention/src/main/kotlin"))
}
