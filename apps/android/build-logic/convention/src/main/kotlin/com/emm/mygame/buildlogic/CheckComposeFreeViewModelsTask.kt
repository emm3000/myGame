package com.emm.mygame.buildlogic

import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction

abstract class CheckComposeFreeViewModelsTask : DefaultTask() {

    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val sourceFiles: ConfigurableFileCollection

    @TaskAction
    fun check() {
        val composeReference: Regex = Regex("""\bandroidx\.compose\b""")
        val violations: List<String> = buildList {
            sourceFiles.forEach { file ->
                file.readLines().forEachIndexed { index, line ->
                    if (composeReference.containsMatchIn(line)) {
                        add("${file.path}:${index + 1}: $line")
                    }
                }
            }
        }
        check(violations.isEmpty()) {
            violations.joinToString(separator = "\n", prefix = "A ViewModel or UiState reaches androidx.compose:\n")
        }
    }
}
