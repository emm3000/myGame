package com.emm.mygame.core.network

data class ArtState(
    val kind: ArtKind,
    val level: Int,
    val resource: ResourceKind,
    val ratePercent: Double,
    val nextLevel: NextArtLevel?,
)
