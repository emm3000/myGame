package com.emm.mygame.core.ui

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.unit.DpRect
import org.junit.Assert.assertTrue

fun assertAskingProgressDrawnOnce(composeRule: ComposeContentTestRule, band: String, position: String) {
    val bandLine: SemanticsMatcher = hasContentDescription(band)
    val positionLine: SemanticsMatcher = hasText(position)
    val track: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo)
    composeRule.onAllNodes(bandLine).assertCountEquals(1)
    composeRule.onAllNodes(positionLine).assertCountEquals(1)
    val bandBounds: DpRect = composeRule.onNode(bandLine).getUnclippedBoundsInRoot()
    val positionBounds: DpRect = composeRule.onNode(positionLine).getUnclippedBoundsInRoot()
    val trackBounds: DpRect = composeRule.onNode(track).getUnclippedBoundsInRoot()
    assertTrue(bandBounds.bottom <= positionBounds.top)
    assertTrue(positionBounds.bottom <= trackBounds.top)
}

fun hasCopy(line: String): SemanticsMatcher = hasText(line).or(hasContentDescription(line, substring = true))
