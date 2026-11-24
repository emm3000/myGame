package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownRegistered
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownHomeGutterTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val readTown: TownUiState.Content = townOf().contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    @Test
    fun `holds the folded dock and the Report row at the gutter from the home's first frame on`() {
        composeRule.mainClock.autoAdvance = false
        showHome()

        assertInsets(FOLDED_NOTICE, "first frame")
        assertInsets(REPORT_ROW, "first frame")

        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()

        assertInsets(FOLDED_NOTICE, "page header drawn")
        assertInsets(REPORT_ROW, "page header drawn")
    }

    private fun showHome() {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = readTown,
                    onIntent = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                    onTextOpen = {},
                    foldedDock = { BasicText(FOLDED_NOTICE, modifier = Modifier.fillMaxWidth()) },
                    reportRow = { BasicText(REPORT_ROW, modifier = Modifier.fillMaxWidth()) },
                )
            }
        }
    }

    private fun assertInsets(text: String, frame: String) {
        val screen: DpRect = composeRule.onRoot().getBoundsInRoot()
        val slot: DpRect = composeRule.onNodeWithText(text).getBoundsInRoot()
        val left: Dp = slot.left - screen.left
        val right: Dp = screen.right - slot.right
        assertEquals("$text left inset on the $frame", MyGameSpacing.step4.value, left.value, TOLERANCE_DP)
        assertEquals("$text right inset on the $frame", MyGameSpacing.step4.value, right.value, TOLERANCE_DP)
    }

    private companion object {
        const val FOLDED_NOTICE: String = "Folded notice"
        const val REPORT_ROW: String = "Report row"
        const val TOLERANCE_DP: Float = 0.5f
    }
}
