package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolBandLinesTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(town: TownSnapshot) {
        val content: SchoolUiState.Content =
            town.contentAt(readInstant, Duration.ZERO, SchoolMutations.none, selected = null)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(state = content, onIntent = {}, onLessonOpen = {}, onTextOpen = {})
            }
        }
    }

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows the held words of each started band`() {
        show(
            townOf(
                hasBandStarted = true,
                bandLines = listOf(
                    TownSnapshot.BandLine(PlacementBand.First, count = 12, total = 875),
                    TownSnapshot.BandLine(PlacementBand.Second, count = 0, total = 875),
                ),
            ),
        )

        showing("Banda 1: 12 de 875 palabras estudiadas")
        showing("Banda 2: 0 de 875 palabras estudiadas")
    }

    @Test
    fun `shows no band line before a band starts`() {
        show(townOf())

        composeRule.onAllNodesWithText("palabras estudiadas", substring = true).assertCountEquals(0)
    }
}
