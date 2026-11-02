package com.emm.mygame.buildlogic

import org.gradle.api.Project
import org.gradle.kotlin.dsl.dependencies

internal fun Project.configureUnitTests() {
    dependencies {
        add("testImplementation", libs.library("junit"))
        add("testImplementation", libs.library("kotlinx-coroutines-test"))
        add("testImplementation", libs.library("turbine"))
    }
}
