package com.emm.mygame.feature.fief

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.SeasonKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SeasonLineTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Before
    fun drawFallWithSecondsLeft() {
        composeRule.setContent {
            MyGameTheme {
                SeasonLine(
                    season = FiefUiState.SeasonLine(
                        kind = SeasonKind.Fall,
                        year = 1,
                        next = SeasonKind.Winter,
                        countdown = FiefUiState.SeasonCountdown.InSeconds(seconds = 42),
                    ),
                )
            }
        }
    }

    @Test
    fun `keeps the countdown's digits tabular while it repaints every second`() {
        assertEquals("tnum", fontFeaturesOf(text = "Invierno en 42 s"))
    }

    @Test
    fun `keeps the season's header in proportional figures`() {
        assertNull(fontFeaturesOf(text = "Otoño, año 1"))
    }

    private fun fontFeaturesOf(text: String): String? {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        val node: SemanticsNode = composeRule.onNodeWithText(text).fetchSemanticsNode()
        node.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().layoutInput.style.fontFeatureSettings
    }
}
