package com.emm.mygame.buildlogic

import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction

abstract class CheckStructureTask : DefaultTask() {

    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val sourceFiles: ConfigurableFileCollection

    @get:InputFile
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val baseline: RegularFileProperty

    @get:Internal
    abstract val androidRoot: DirectoryProperty

    @TaskAction
    fun check() {
        val root: File = androidRoot.get().asFile
        val baselineFile: File = baseline.get().asFile
        val sources: List<SourceFile> = sourceFiles.files.map { file ->
            SourceFile(file.relativeTo(root).invariantSeparatorsPath, file.readText())
        }
        val findings: List<String> = structureFindingsOf(sources, baselineFile.readLines(), clientStructureLimits)
        check(findings.isEmpty()) {
            findings.joinToString(
                separator = "\n",
                prefix = "Structure violations (ADR 056, sections 6 and 7) against ${baselineFile.relativeTo(root)}:\n",
            )
        }
    }
}
