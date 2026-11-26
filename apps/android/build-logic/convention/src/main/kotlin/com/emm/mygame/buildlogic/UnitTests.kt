package com.emm.mygame.buildlogic

import org.gradle.api.Project
import org.gradle.kotlin.dsl.dependencies
import org.gradle.kotlin.dsl.withType
import org.jetbrains.kotlin.gradle.tasks.KotlinJvmCompile

private const val EXPERIMENTAL_COROUTINES_API: String = "kotlinx.coroutines.ExperimentalCoroutinesApi"

internal fun Project.configureUnitTests() {
    dependencies {
        add("testImplementation", libs.library("junit"))
        add("testImplementation", libs.library("kotlinx-coroutines-test"))
        add("testImplementation", libs.library("turbine"))
    }

    tasks.withType<KotlinJvmCompile>().named(::compilesUnitTests).configureEach {
        compilerOptions.optIn.add(EXPERIMENTAL_COROUTINES_API)
    }
}

private fun compilesUnitTests(taskName: String): Boolean =
    taskName == "compileTestKotlin" || taskName.endsWith("UnitTestKotlin")
