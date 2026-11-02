package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ArtState
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.NextArtLevel
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun FiefSnapshot.libraryAt(
    now: Instant,
    amounts: Map<ResourceKind, Long>,
    study: FiefUiState.StudyStatus,
): FiefUiState.LibraryLine? {
    val libraryLevel: Int = libraryLevel()
    if (libraryLevel < 1) return null
    return FiefUiState.LibraryLine(
        slot = studySlotLineAt(now),
        arts = arts.map { art: ArtState -> art.cardWith(amounts = amounts, libraryLevel = libraryLevel) },
        study = study,
    )
}

internal fun FiefSnapshot.studyRemainingAt(now: Instant): Duration? = when (val current: StudySlot = study) {
    StudySlot.Idle -> null
    is StudySlot.Busy -> countdownTo(finishesAt = current.finishesAt, now = now)
}

private fun FiefSnapshot.libraryLevel(): Int =
    buildings.firstOrNull { building: BuildingState -> building.kind == BuildingKind.Library }?.level ?: 0

private fun FiefSnapshot.studySlotLineAt(now: Instant): FiefUiState.StudySlotLine =
    when (val current: StudySlot = study) {
        StudySlot.Idle -> FiefUiState.StudySlotLine.Idle
        is StudySlot.Busy -> FiefUiState.StudySlotLine.Busy(
            art = current.art,
            targetLevel = current.targetLevel,
            remaining = countdownTo(finishesAt = current.finishesAt, now = now),
            refund = refundOf(current),
        )
    }

private fun FiefSnapshot.refundOf(busy: StudySlot.Busy): List<ResourceCost> {
    val cost: List<ResourceCost> = arts.firstOrNull { art: ArtState -> art.kind == busy.art }?.nextLevel?.cost.orEmpty()
    return cost.filter { resource: ResourceCost -> resource.amount > 0 }
}

private fun ArtState.cardWith(amounts: Map<ResourceKind, Long>, libraryLevel: Int): FiefUiState.ArtCard =
    FiefUiState.ArtCard(
        kind = kind,
        level = level,
        resource = resource,
        ratePercent = ratePercent,
        next = nextLevel?.lineWith(amounts = amounts, libraryLevel = libraryLevel),
    )

private fun NextArtLevel.lineWith(amounts: Map<ResourceKind, Long>, libraryLevel: Int): FiefUiState.NextArtLine =
    FiefUiState.NextArtLine(
        level = level,
        ratePercent = ratePercent,
        costs = cost.filter { resource: ResourceCost -> resource.amount > 0 }.map { resource: ResourceCost ->
            FiefUiState.CostLine(
                kind = resource.kind,
                amount = resource.amount,
                isShort = resource.shortfallFrom(amounts) > 0,
            )
        },
        duration = duration,
        requiredLibraryLevel = requiredLibraryLevel,
        isLibraryTooLow = requiredLibraryLevel > libraryLevel,
    )
