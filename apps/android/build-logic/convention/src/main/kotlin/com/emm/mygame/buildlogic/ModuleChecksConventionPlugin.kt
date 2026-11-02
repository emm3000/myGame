package com.emm.mygame.buildlogic

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.ProjectDependency
import org.gradle.api.file.ConfigurableFileTree
import org.gradle.api.tasks.TaskProvider
import org.gradle.kotlin.dsl.register

private val androidPluginIds: Set<String> = setOf("com.android.application", "com.android.library")

private val jvmOnlyModules: Set<String> = setOf(":core:projection")

private val allowedCoreEdges: Map<String, Set<String>> = mapOf(
    ":core:network" to emptySet(),
    ":core:projection" to emptySet(),
    ":core:designsystem" to emptySet(),
    ":core:ui" to setOf(":core:projection", ":core:designsystem"),
    ":core:testing" to setOf(":core:network", ":core:projection"),
)

private val allowedFeatureEdges: Set<String> =
    setOf(":core:network", ":core:projection", ":core:ui", ":core:designsystem")

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
                .map { "${configuration.name}=${it.path}" }
        }
        .distinct()

private fun Project.jvmOnlyModulesWithAndroidPlugin(): List<String> =
    subprojects
        .filter { it.path in jvmOnlyModules }
        .filter { module -> androidPluginIds.any(module.plugins::hasPlugin) }
        .map { it.path }

private fun Project.viewModelAndUiStateSources(): List<ConfigurableFileTree> =
    subprojects.map { module -> module.fileTree("src") { include("**/*ViewModel.kt", "**/*UiState.kt") } }
