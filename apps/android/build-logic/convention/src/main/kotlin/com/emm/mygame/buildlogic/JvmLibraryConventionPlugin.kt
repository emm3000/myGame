package com.emm.mygame.buildlogic

import org.gradle.api.Plugin
import org.gradle.api.Project

class JvmLibraryConventionPlugin : Plugin<Project> {

    override fun apply(target: Project) {
        with(target) {
            pluginManager.apply("org.jetbrains.kotlin.jvm")

            configureKotlinJvm()

            tasks.register("testDebugUnitTest") {
                group = "verification"
                description = "Runs this JVM module's unit tests under the name the Android modules use."
                dependsOn(tasks.named("test"))
            }
        }
    }
}
