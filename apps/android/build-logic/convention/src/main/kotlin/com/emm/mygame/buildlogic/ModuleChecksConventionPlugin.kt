package com.emm.mygame.buildlogic

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.ProjectDependency
import org.gradle.api.file.ConfigurableFileTree
import org.gradle.api.tasks.TaskProvider
import org.gradle.kotlin.dsl.register

private val androidPluginIds: Set<String> = setOf("com.android.application", "com.android.library")

private val jvmOnlyModules: Set<String> = setOf(":core:model", ":core:projection", ":core:testing")

private val allowedCoreEdges: Map<String, Set<String>> = mapOf(
    ":core:model" to emptySet(),
    ":core:network" to setOf(":core:model"),
    ":core:projection" to emptySet(),
    ":core:designsystem" to emptySet(),
    ":core:ui" to setOf(":core:model", ":core:projection", ":core:designsystem"),
    ":core:testing" to setOf(":core:model", ":core:projection"),
)

private val allowedFeatureEdges: Set<String> =
    setOf(":core:model", ":core:projection", ":core:ui", ":core:designsystem")

class ModuleChecksConventionPlugin : Plugin<Project> {

    override fun apply(target: Project) {
        with(target) {
            val checkModuleBoundaries: TaskProvider<CheckModuleBoundariesTask> =
                tasks.register<CheckModuleBoundariesTask>("checkModuleBoundaries") {
                    group = "verification"
                    description = "Fails on any module edge android-architecture.md's Modules table does not allow."
                }

            val checkComposeFreeViewModels: TaskProvider<CheckComposeFreeViewModelsTask> =
                tasks.register<CheckComposeFreeViewModelsTask>("checkComposeFreeViewModels") {
                    group = "verification"
                    description = "Fails when a *ViewModel.kt or *UiState.kt file references androidx.compose."
                }

            tasks.register<CheckStructureTask>("checkStructure") {
                group = "verification"
                description = "Fails on an ADR 056 limit the baseline does not hold, and on a stale baseline line."
                sourceFiles.setFrom(
                    fileTree(rootDir) {
                        include("**/*.kt")
                        exclude("**/build/**", "**/.gradle/**", "**/.kotlin/**")
                    },
                )
                baseline.set(layout.projectDirectory.file("config/structure/baseline.txt"))
                androidRoot.set(layout.projectDirectory)
                dependsOn(gradle.includedBuild("build-logic").task(":convention:test"))
            }

            gradle.projectsEvaluated {
                checkModuleBoundaries.configure {
                    edgesByModule.set(moduleEdges())
                    coreEdges.set(allowedCoreEdges)
                    featureEdges.set(allowedFeatureEdges)
                    jvmOnlyModulesWithAndroidPlugin.set(jvmOnlyModulesWithAndroidPlugin())
                }
                checkComposeFreeViewModels.configure {
                    sourceFiles.setFrom(viewModelAndUiStateSources())
                }
            }
        }
    }
}

private fun Project.moduleEdges(): Map<String, List<String>> =
    subprojects.filter { it.buildFile.exists() }.associate { module -> module.path to module.projectEdges() }

private fun Project.projectEdges(): List<String> =
    configurations
        .flatMap { configuration ->
            configuration.dependencies
                .filterIsInstance<ProjectDependency>()
                .filter { it.path != path }
                .map { "${configuration.name}=${it.path}${it.featureSuffix()}" }
        }
        .distinct()

private fun ProjectDependency.featureSuffix(): String =
    requestedCapabilities.joinToString(separator = "") { capability ->
        if (capability.name.endsWith("-test-fixtures")) TEST_FIXTURES else "(${capability.name})"
    }

private fun Project.jvmOnlyModulesWithAndroidPlugin(): List<String> =
    subprojects
        .filter { it.path in jvmOnlyModules }
        .filter { module -> androidPluginIds.any(module.plugins::hasPlugin) }
        .map { it.path }

private fun Project.viewModelAndUiStateSources(): List<ConfigurableFileTree> =
    subprojects.map { module -> module.fileTree("src") { include("**/*ViewModel.kt", "**/*UiState.kt") } }
