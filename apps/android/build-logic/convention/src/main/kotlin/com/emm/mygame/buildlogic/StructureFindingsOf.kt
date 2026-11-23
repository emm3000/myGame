package com.emm.mygame.buildlogic

private val structureChecks: List<StructureCheck> = sizeChecks + boundaryChecks + nameChecks

fun structureFindingsOf(sources: List<SourceFile>, baseline: List<String>, limits: StructureLimits): List<String> {
    val violationsByLine: Map<String, List<StructureViolation>> = structureChecks
        .flatMap { check -> check(sources, limits) }
        .groupBy(StructureViolation::baselineLine)
    val baselineCounts: Map<String, Int> = baseline.filter(String::isNotBlank).groupingBy { it }.eachCount()
    val unlisted: List<String> = violationsByLine.flatMap { (line, violations) ->
        violations.drop(baselineCounts[line] ?: 0).map { "$line: ${it.detail}" }
    }
    val stale: List<String> = baselineCounts.flatMap { (line, count) ->
        List((count - violationsByLine[line].orEmpty().size).coerceAtLeast(0)) {
            "$line: in the baseline but no longer a violation; delete the line"
        }
    }
    return unlisted + stale
}
