package com.emm.mygame.buildlogic

data class ModuleBoundaries(
    val coreEdges: Map<String, Set<String>>,
    val featureEdges: Set<String>,
)
