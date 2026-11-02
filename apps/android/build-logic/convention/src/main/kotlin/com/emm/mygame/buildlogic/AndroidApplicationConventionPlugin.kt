package com.emm.mygame.buildlogic

import com.android.build.api.dsl.ApplicationExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.getByType

class AndroidApplicationConventionPlugin : Plugin<Project> {

    override fun apply(target: Project) {
        with(target) {
            pluginManager.apply("com.android.application")
            pluginManager.apply("org.jetbrains.kotlin.plugin.compose")

            val extension: ApplicationExtension = extensions.getByType<ApplicationExtension>()
            configureKotlinAndroid(extension)
            extension.defaultConfig.targetSdk = TARGET_SDK
            configureAndroidCompose(extension)
        }
    }
}
