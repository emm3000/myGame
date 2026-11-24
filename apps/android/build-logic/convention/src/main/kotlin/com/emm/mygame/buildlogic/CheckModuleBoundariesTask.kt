package com.emm.mygame.buildlogic

import org.gradle.api.DefaultTask
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.MapProperty
import org.gradle.api.provider.SetProperty
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.TaskAction

abstract class CheckModuleBoundariesTask : DefaultTask() {

    @get:Input
    abstract val edgesByModule: MapProperty<String, List<String>>

    @get:Input
    abstract val coreEdges: MapProperty<String, Set<String>>

    @get:Input
    abstract val featureEdges: SetProperty<String>

    @get:Input
    abstract val jvmOnlyModulesWithAndroidPlugin: ListProperty<String>

    @TaskAction
    fun check() {
        val violations: List<String> = moduleBoundaryViolationsOf(
            edgesByModule.get(),
            ModuleBoundaries(coreEdges.get(), featureEdges.get()),
            jvmOnlyModulesWithAndroidPlugin.get(),
        )
        check(violations.isEmpty()) {
            violations.joinToString(separator = "\n", prefix = "Module boundary violations:\n")
        }
    }
}
