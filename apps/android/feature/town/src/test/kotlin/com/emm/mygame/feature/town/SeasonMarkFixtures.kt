package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.ui.SEASON_MARK_ICON

internal val seasonWords: Map<SeasonKind, String> = mapOf(
    SeasonKind.Spring to "Primavera",
    SeasonKind.Summer to "Verano",
    SeasonKind.Fall to "Otoño",
    SeasonKind.Winter to "Invierno",
)

internal val seasonIcons: Map<SeasonKind, ImageVector> = mapOf(
    SeasonKind.Spring to MyGameIcons.spring,
    SeasonKind.Summer to MyGameIcons.summer,
    SeasonKind.Fall to MyGameIcons.fall,
    SeasonKind.Winter to MyGameIcons.winter,
)

internal fun seasonMarkOf(icon: ImageVector, text: String): SemanticsMatcher =
    SemanticsMatcher.expectValue(SEASON_MARK_ICON, icon) and hasAnyDescendant(hasText(text, substring = true))
