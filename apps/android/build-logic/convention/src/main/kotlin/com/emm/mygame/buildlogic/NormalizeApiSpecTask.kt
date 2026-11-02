package com.emm.mygame.buildlogic

import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction

abstract class NormalizeApiSpecTask : DefaultTask() {

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val specification: RegularFileProperty

    @get:OutputFile
    abstract val normalized: RegularFileProperty

    @TaskAction
    fun normalize() {
        val parsed: Any? = JsonSlurper().parse(specification.asFile.get())
        normalized.asFile.get().writeText(JsonOutput.toJson(withWholeNumberLiteralsAsIntegers(parsed)))
    }
}

private fun withWholeNumberLiteralsAsIntegers(node: Any?): Any? = when (node) {
    is Map<*, *> -> {
        val rewritten: Map<Any?, Any?> = node.entries.associate { (key, value) ->
            key to withWholeNumberLiteralsAsIntegers(value)
        }
        if (rewritten.isNumberLiteralOfWholeNumbers()) rewritten + ("type" to "integer") else rewritten
    }
    is List<*> -> node.map { withWholeNumberLiteralsAsIntegers(it) }
    else -> node
}

private fun Map<Any?, Any?>.isNumberLiteralOfWholeNumbers(): Boolean {
    val literals: List<*> = this["enum"] as? List<*> ?: return false
    return this["type"] == "number" && literals.all { it is Number && it.toDouble() % 1.0 == 0.0 }
}
