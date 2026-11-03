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
    readyTerms: ReadyTerms,
    amounts: Map<ResourceKind, Long>,
    study: FiefUiState.StudyStatus,
): FiefUiState.LibraryLine? {
    val libraryLevel: Int = libraryLevel()
    if (libraryLevel < 1) return null
    val context: StudyContext = StudyContext(
        amounts = amounts,
        libraryLevel = libraryLevel,
        isStudyRunning = this.study is StudySlot.Busy,
        readyTerms = readyTerms,
    )
    return FiefUiState.LibraryLine(
        slot = studySlotLineAt(readyTerms.now),
        arts = arts.map { art: ArtState -> art.cardWith(context) },
        study = study,
    )
}

internal fun FiefSnapshot.studyRemainingAt(now: Instant): Duration? = when (val current: StudySlot = study) {
    StudySlot.Idle -> null
    is StudySlot.Busy -> countdownTo(finishesAt = current.finishesAt, now = now)
}

private data class StudyContext(
    val amounts: Map<ResourceKind, Long>,
    val libraryLevel: Int,
    val isStudyRunning: Boolean,
    val readyTerms: ReadyTerms,
)

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

private fun refundOf(busy: StudySlot.Busy): List<ResourceCost> =
    busy.cost.filter { resource: ResourceCost -> resource.amount > 0 }

private fun ArtState.cardWith(context: StudyContext): FiefUiState.ArtCard =
    FiefUiState.ArtCard(
        kind = kind,
        level = level,
        resource = resource,
        ratePercent = ratePercent,
        next = nextLevel?.lineWith(context),
    )

private fun NextArtLevel.lineWith(context: StudyContext): FiefUiState.NextArtLine =
    FiefUiState.NextArtLine(
        level = level,
        ratePercent = ratePercent,
        costs = cost.filter { resource: ResourceCost -> resource.amount > 0 }.map { resource: ResourceCost ->
            FiefUiState.CostLine(
                kind = resource.kind,
                amount = resource.amount,
                isShort = resource.shortfallFrom(context.amounts) > 0,
            )
        },
        duration = duration,
        requiredLibraryLevel = requiredLibraryLevel,
        isLibraryTooLow = requiredLibraryLevel > context.libraryLevel,
        block = blockWith(context),
    )

private fun NextArtLevel.blockWith(context: StudyContext): FiefUiState.StudyBlock? =
    when {
        context.isStudyRunning -> FiefUiState.StudyBlock.StudyRunning
        requiredLibraryLevel > context.libraryLevel ->
            FiefUiState.StudyBlock.LibraryTooLow(required = requiredLibraryLevel, built = context.libraryLevel)
        else -> context.readyTerms.resourcesBlockOf(cost = cost, amounts = context.amounts)
    }
