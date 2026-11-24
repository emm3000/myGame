package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownHiringMarkLookTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val lockedWorkers: TownUiState.HiringCard =
        TownUiState.HiringCard(TownHireKind.Worker, team = 4, requiredOfficeLevel = 3, form = null)

    private val hiring: TownUiState.Hiring = idleHiring.copy(hires = listOf(lockedWorkers))

    private val springHire: TownUiState.DurationMark = TownUiState.DurationMark(SeasonKind.Spring, percent = 75)

    @Test
    fun `draws the hire mark directly under the hiring heading`() {
        show(hiring.copy(hireMark = springHire))

        assertTrue(topOf(HIRING_HEADING) < topOf(SPRING_HIRE))
        assertTrue(topOf(SPRING_HIRE) < topOf(IDLE_LINE))
    }

    @Test
    fun `draws the hire mark above the hire items`() {
        show(hiring.copy(hireMark = springHire))

        assertTrue(topOf(SPRING_HIRE) < topOf(WORKERS))
    }

    @Test
    fun `draws no hire mark while the overview answers none`() {
        show(hiring)

        composeRule.onAllNodesWithText(SPRING_HIRE).assertCountEquals(0)
    }

    @Test
    fun `sets the hire mark in caption`() {
        show(hiring.copy(hireMark = springHire))

        assertEquals(MyGameTypography.caption.fontSize, textStyleOf(SPRING_HIRE).fontSize)
    }

    @Test
    fun `sets the hire mark in ink-muted`() {
        var inkMuted: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inkMuted = MyGameTheme.colors.inkMuted
                TownHome(homeWith(hiring.copy(hireMark = springHire)))
            }
        }

        assertEquals(inkMuted, textStyleOf(SPRING_HIRE).color)
    }

    @Test
    fun `names each season on the hire mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(homeWith(hiring))
        composeRule.setContent { MyGameTheme { TownHome(home.value) } }

        seasonWords.forEach { (season: SeasonKind, word: String) ->
            home.value = homeWith(hiring.copy(hireMark = TownUiState.DurationMark(season, percent = 75)))
            composeRule.waitForIdle()

            composeRule.onNodeWithText("$word: las contrataciones tardan el 75 % del tiempo").assertExists()
        }
    }

    @Test
    fun `draws each season's icon beside the hire mark`() {
        val home: MutableState<TownUiState> = mutableStateOf(homeWith(hiring))
        composeRule.setContent { MyGameTheme { TownHome(home.value) } }

        seasonIcons.forEach { (season: SeasonKind, icon: ImageVector) ->
            home.value = homeWith(hiring.copy(hireMark = TownUiState.DurationMark(season, percent = 75)))
            composeRule.waitForIdle()

            composeRule.onNode(seasonMarkOf(icon, text = "las contrataciones tardan el 75 % del tiempo")).assertExists()
        }
    }

    @Test
    fun `prints the hire percent as sent`() {
        show(hiring.copy(hireMark = TownUiState.DurationMark(SeasonKind.Winter, percent = 125)))

        composeRule.onNodeWithText("Invierno: las contrataciones tardan el 125 % del tiempo").assertExists()
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun topOf(text: String): Dp = composeRule.onAllNodesWithText(text).onLast().getUnclippedBoundsInRoot().top

    private fun show(shown: TownUiState.Hiring) {
        composeRule.setContent { MyGameTheme { TownHome(homeWith(shown)) } }
    }

    @Composable
    private fun TownHome(state: TownUiState) {
        TownScreen(
            state = state,
            onIntent = { },
            onSchoolOpen = { },
            onMapOpen = { },
            onTextOpen = {},
        )
    }

    private fun homeWith(shown: TownUiState.Hiring): TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = emptyList(),
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        words = TownUiState.WordsLine(stable = 0, retained = 0),
        season = null,
        buildMark = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = listOf(bareOffice),
        nextStepPlace = TownBuildingKind.Office,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        hiring = shown,
    )

    private companion object {
        const val HIRING_HEADING: String = "Contratación"
        const val IDLE_LINE: String = "Ahora no hay ninguna contratación."
        const val WORKERS: String = "Trabajadores"
        const val SPRING_HIRE: String = "Primavera: las contrataciones tardan el 75 % del tiempo"
    }
}
