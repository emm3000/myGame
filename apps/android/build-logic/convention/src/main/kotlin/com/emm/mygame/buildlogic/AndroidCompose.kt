package com.emm.mygame.buildlogic

import com.android.build.api.dsl.CommonExtension
import org.gradle.api.Project
import org.gradle.kotlin.dsl.dependencies

internal fun Project.configureAndroidCompose(commonExtension: CommonExtension) {
    commonExtension.buildFeatures.compose = true

    dependencies {
        add("implementation", platform(libs.library("androidx-compose-bom")))
        add("implementation", libs.library("androidx-compose-ui"))
        add("implementation", libs.library("androidx-compose-foundation"))
    }
}
