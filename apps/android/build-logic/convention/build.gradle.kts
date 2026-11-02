plugins {
    `kotlin-dsl`
}

group = "com.emm.mygame.buildlogic"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(libs.android.gradle.plugin)
    implementation(libs.kotlin.gradle.plugin)
    implementation(libs.compose.compiler.gradle.plugin)
}

gradlePlugin {
    plugins {
        register("androidApplication") {
            id = "mygame.android.application"
            implementationClass = "com.emm.mygame.buildlogic.AndroidApplicationConventionPlugin"
        }
        register("androidLibrary") {
            id = "mygame.android.library"
            implementationClass = "com.emm.mygame.buildlogic.AndroidLibraryConventionPlugin"
        }
        register("androidCompose") {
            id = "mygame.android.compose"
            implementationClass = "com.emm.mygame.buildlogic.AndroidComposeConventionPlugin"
        }
        register("moduleChecks") {
            id = "mygame.module.checks"
            implementationClass = "com.emm.mygame.buildlogic.ModuleChecksConventionPlugin"
        }
        register("jvmLibrary") {
            id = "mygame.jvm.library"
            implementationClass = "com.emm.mygame.buildlogic.JvmLibraryConventionPlugin"
        }
    }
}
