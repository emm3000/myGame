package com.emm.mygame.buildlogic

private val privateVar: Regex = Regex("""^\s+private var """, RegexOption.MULTILINE)

val sizeChecks: List<StructureCheck> = listOf(::productionFileLines, ::testFileLines, ::packageFiles, ::privateVars)

private fun productionFileLines(sources: List<SourceFile>, limits: StructureLimits): List<StructureViolation> =
    sources.filter(SourceFile::isProduction).linesOver(limits.productionFileLines, "file-lines")

private fun testFileLines(sources: List<SourceFile>, limits: StructureLimits): List<StructureViolation> =
    sources.filter(SourceFile::isTest).linesOver(limits.testFileLines, "test-lines")

private fun List<SourceFile>.linesOver(limit: Int, check: String): List<StructureViolation> =
    filter { it.lineCount > limit }.map { StructureViolation(check, it.path, "${it.lineCount} lines, over $limit") }

private fun packageFiles(sources: List<SourceFile>, limits: StructureLimits): List<StructureViolation> =
    sources
        .filter { it.isProduction && !it.fileName.endsWith("Preview.kt") }
        .groupBy(SourceFile::directory)
        .filter { (_, files) -> files.size > limits.productionFilesPerPackage }
        .map { (directory, files) ->
            StructureViolation(
                "package-files",
                directory,
                "${files.size} production files, over ${limits.productionFilesPerPackage}",
            )
        }

private fun privateVars(sources: List<SourceFile>, limits: StructureLimits): List<StructureViolation> =
    sources
        .filter(SourceFile::isProduction)
        .associateWith { privateVar.findAll(it.text).count() }
        .filter { (_, count) -> count > limits.privateVarsPerFile }
        .map { (file, count) ->
            StructureViolation("private-vars", file.path, "$count private vars, over ${limits.privateVarsPerFile}")
        }
