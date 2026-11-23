package com.emm.mygame.buildlogic

private val structureChecks: List<StructureCheck> = sizeChecks + boundaryChecks + nameChecks

fun structureFindingsOf(sources: List<SourceFile>, baseline: List<String>, limits: StructureLimits): List<String> {
    val violations: List<StructureViolation> = structureChecks.flatMap { check -> check(sources, limits) }
    val baselineCounts: Map<String, Int> = baseline.filter(String::isNotBlank).groupingBy { it }.eachCount()
    val violationCounts: Map<String, Int> = violations.groupingBy(StructureViolation::baselineLine).eachCount()
    val unlisted: List<String> = violations
        .filter { violationCounts.getValue(it.baselineLine) > baselineCounts[it.baselineLine] ?: 0 }
        .map { "${it.baselineLine}: ${it.detail}" }
    val stale: List<String> = baselineCounts.flatMap { (line, count) ->
        List((count - (violationCounts[line] ?: 0)).coerceAtLeast(0)) {
            "$line: in the baseline but no longer a violation; delete the line"
        }
    }
    return unlisted + stale
}
