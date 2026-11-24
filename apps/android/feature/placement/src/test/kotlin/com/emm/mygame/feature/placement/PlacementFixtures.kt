package com.emm.mygame.feature.placement

import com.emm.mygame.core.model.placement.Placement
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementScore
import com.emm.mygame.core.testing.house
import com.emm.mygame.core.testing.walk

internal val firstBandPassed: PlacementScore = PlacementScore(PlacementBand.First, score = 30, isPlacedOut = true)

internal val secondBandFailed: PlacementScore = PlacementScore(PlacementBand.Second, score = 12, isPlacedOut = false)

internal val firstBandAsked: Placement.Asking =
    Placement.Asking(band = PlacementBand.First, items = listOf(house, walk), scores = emptyList())

internal val secondBandAsked: Placement.Asking =
    Placement.Asking(band = PlacementBand.Second, items = listOf(walk), scores = listOf(firstBandPassed))

internal val placedAtSecondBand: Placement.Closed = Placement.Closed(listOf(firstBandPassed, secondBandFailed))

internal val skipped: Placement.Closed = Placement.Closed(emptyList())
