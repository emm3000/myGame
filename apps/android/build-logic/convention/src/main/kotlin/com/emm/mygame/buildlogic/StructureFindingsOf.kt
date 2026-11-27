package com.emm.mygame.buildlogic

private val structureChecks: List<StructureCheck> = sizeChecks + boundaryChecks + nameChecks

fun structureFindingsOf(sources: List<SourceFile>, limits: StructureLimits): List<String> =
    structureChecks
        .flatMap { check -> check(sources, limits) }
        .map { violation -> "${violation.check} ${violation.path}: ${violation.detail}" }
