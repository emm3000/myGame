package com.emm.mygame.buildlogic

private val featureStateImport: Regex =
    Regex("""^import com\.emm\.mygame\.feature\.[\w.]+(ViewModel|UiState|Intent|Effect)$""", RegexOption.MULTILINE)

private val projectionGap: Regex = Regex("""readAt - clock\.now\(\)|fun serverNow""")

val boundaryChecks: List<StructureCheck> = listOf(
    { sources, _ -> appFeatureStates(sources) },
    { sources, _ -> projectionGaps(sources) },
)

private fun appFeatureStates(sources: List<SourceFile>): List<StructureViolation> =
    sources
        .filter { it.isProduction && it.path.startsWith("app/") }
        .flatMap { file ->
            featureStateImport.findAll(file.text).map { StructureViolation("app-feature-state", file.path, it.value) }
        }

private fun projectionGaps(sources: List<SourceFile>): List<StructureViolation> {
    val writers: List<SourceFile> = sources
        .filter { it.isProduction && projectionGap.containsMatchIn(it.text) }
        .sortedBy(SourceFile::path)
    val home: SourceFile = writers.firstOrNull() ?: return emptyList()
    val detail: String = "writes the projection's gap, which ${home.path} already writes"
    return writers.drop(1).map { writer -> StructureViolation("projection-gap", writer.path, detail) }
}
