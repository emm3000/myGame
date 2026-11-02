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
        val violations: List<String> = buildList {
            edgesByModule.get().forEach { (module, edges) ->
                val allowed: Set<String>? = allowedEdgesOf(module)
                if (allowed == null) {
                    add("$module is not in the Modules table of .claude/rules/android-architecture.md")
                }
                edges.map { it.split('=', limit = 2) }.forEach { (configuration, target) ->
                    edgeViolation(module, configuration, target, allowed.orEmpty())?.let(::add)
                }
            }
            jvmOnlyModulesWithAndroidPlugin.get().forEach { module ->
                add("$module applies an Android plugin; it must stay JVM-only")
            }
        }
        check(violations.isEmpty()) {
            violations.joinToString(separator = "\n", prefix = "Module boundary violations:\n")
        }
    }

    private fun allowedEdgesOf(module: String): Set<String>? = when {
        module == ":app" -> emptySet()
        module.startsWith(":feature:") -> featureEdges.get()
        else -> coreEdges.get()[module]
    }

    private fun edgeViolation(module: String, configuration: String, target: String, allowed: Set<String>): String? {
        val isTestConfiguration: Boolean = configuration.startsWith("test") || configuration.startsWith("androidTest")
        return when {
            target == ":core:testing" && !isTestConfiguration ->
                "$module depends on :core:testing through $configuration; only a test configuration may"
            target == ":core:testing" -> null
            module == ":app" && (target.startsWith(":feature:") || target.startsWith(":core:")) -> null
            target in allowed -> null
            else -> "$module depends on $target through $configuration; the Modules table does not allow that edge"
        }
    }
}
