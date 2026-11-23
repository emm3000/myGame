package com.emm.mygame.buildlogic

private val fileNameSuffixes: List<String> = listOf(
    "Route",
    "Screen",
    "ViewModel",
    "UiState",
    "Intent",
    "Effect",
    "ScreenPreview",
    "Mapping",
    "Copy",
    "Requests",
    "Entries",
    "Fixtures",
)

private const val FAKE_PREFIX: String = "Fake"

val nameChecks: List<StructureCheck> = listOf(
    { sources, _ -> duplicateNames(sources) },
    { sources, _ -> screenFiles(sources) },
    { sources, _ -> fileNames(sources) },
)

private fun duplicateNames(sources: List<SourceFile>): List<StructureViolation> =
    duplicatesAmong(sources.filter(SourceFile::isProduction)) + duplicatesAmong(sources.filter(SourceFile::isTest))

private fun duplicatesAmong(files: List<SourceFile>): List<StructureViolation> =
    files
        .groupBy(SourceFile::fileName)
        .values
        .filter { it.size > 1 }
        .flatMap { namesakes ->
            namesakes.sortedBy(SourceFile::path).map { file ->
                val others: String = namesakes.filter { it != file }.sortedBy(SourceFile::path).joinToString { it.path }
                StructureViolation("duplicate-name", file.path, "${file.fileName} is also $others")
            }
        }

private fun screenFiles(sources: List<SourceFile>): List<StructureViolation> =
    sources
        .filter { it.isProduction && it.fileName.endsWith("Screen.kt") }
        .filterNot { file ->
            Regex("""^(internal )?fun ${Regex.escape(file.declaredName)}\(""", RegexOption.MULTILINE)
                .containsMatchIn(file.text)
        }
        .map { StructureViolation("screen-file", it.path, "declares no fun ${it.declaredName}(") }

private fun fileNames(sources: List<SourceFile>): List<StructureViolation> =
    sources
        .filter(SourceFile::isProduction)
        .filterNot(SourceFile::carriesARoleAffix)
        .filterNot(SourceFile::declaresItsName)
        .map {
            StructureViolation(
                "file-name",
                it.path,
                "declares nothing named ${it.declaredName} and carries no suffix of ADR 056, section 5",
            )
        }

private fun SourceFile.carriesARoleAffix(): Boolean =
    fileNameSuffixes.any(declaredName::endsWith) || declaredName.startsWith(FAKE_PREFIX)

private fun SourceFile.declaresItsName(): Boolean {
    val keyword: String = """\b(?:class|interface|object|fun|val|var|typealias)\s+"""
    val typeParameters: String = """(?:<[^>]*>\s*)?"""
    val receiver: String = """(?:[\w.<>?, *]+\.)?"""
    val name: String = "(?i:${Regex.escape(declaredName.take(1))})${Regex.escape(declaredName.drop(1))}\\b"
    return Regex(keyword + typeParameters + receiver + name).containsMatchIn(text)
}
