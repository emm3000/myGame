package com.emm.mygame.buildlogic

import com.android.build.api.dsl.LibraryExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.getByType

class AndroidLibraryConventionPlugin : Plugin<Project> {

    override fun apply(target: Project) {
        with(target) {
            pluginManager.apply("com.android.library")

            val extension: LibraryExtension = extensions.getByType<LibraryExtension>()
            extension.namespace = NAMESPACE_PREFIX + path.replace(':', '.')
            configureKotlinAndroid(extension)
            configureUnitTests()
        }
    }
}
