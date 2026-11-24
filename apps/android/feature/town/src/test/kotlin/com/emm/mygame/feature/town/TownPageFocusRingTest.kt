package com.emm.mygame.feature.town

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TownPageFocusRingTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val levelTwo: TownUiState.NextLevelLine = TownUiState.NextLevelLine(
        level = 2,
        costs = listOf(TownUiState.CostLine(TownResourceKind.Money, 150, isShort = false)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    private val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
            TownUiState.StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
        },
        people = TownUiState.PeopleLine(free = 24, atWork = 96),
        words = TownUiState.WordsLine(stable = 3, retained = 1),
        season = null,
        buildMark = null,
        slot = TownUiState.SlotLine.Idle,
        waitingList = emptyList(),
        places = streetOrder.map { kind: TownBuildingKind ->
            TownUiState.PlaceCard(
                kind = kind,
                level = 1,
                raisedFrom = null,
                isInWork = false,
                next = levelTwo,
                block = null,
            )
        },
        nextStepPlace = TownBuildingKind.School,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = TownUiState.StartStatus.Idle,
        stop = TownUiState.StopStatus.Idle,
        office = idleOffice,
    )

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    fun `draws the build action's focus ring whole on its page`() {
        var inputModes: InputModeManager? = null
        var focus: Color = Color.Unspecified
        composeRule.setContent {
            inputModes = LocalInputModeManager.current
            MyGameTheme {
                focus = MyGameTheme.colors.focus
                TownScreen(state = riverton, onIntent = {}, onSchoolOpen = {}, onMapOpen = {}, onTextOpen = {})
            }
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        val build: SemanticsNodeInteraction = composeRule.onNodeWithTag(OUTLINED_PILL).performScrollTo().requestFocus()

        val bounds: DpRect = build.getBoundsInRoot()
        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val ringX: Int = with(composeRule.density) {
            (bounds.left - MyGameSpacing.step1 - MyGameStrokeWidths.focus / 2).roundToPx()
        }
        val middle: Int = with(composeRule.density) { ((bounds.top + bounds.bottom) / 2).roundToPx() }

        assertEquals(Integer.toHexString(focus.toArgb()), Integer.toHexString(pixels[ringX, middle].toArgb()))
    }
}
