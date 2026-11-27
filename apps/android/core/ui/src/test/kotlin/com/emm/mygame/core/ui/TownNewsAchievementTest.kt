package com.emm.mygame.core.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class TownNewsAchievementTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws an achievement's line in on-block in the dark theme`() {
        var onBlock: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme(darkTheme = true) {
                onBlock = MyGameTheme.colors.onBlock
                TownNewsAchievement(news = farmBuilt, receivedAt = receivedAt)
            }
        }

        assertEquals(onBlock, colorOf(FARM_BUILT))
    }

    private fun colorOf(text: String): Color {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().layoutInput.style.color
    }

    private companion object {
        const val FARM_BUILT: String = "Farm: now level 2."
        val receivedAt: Instant = Instant.parse("2026-11-05T10:00:00Z")
        val farmBuilt: TownNews =
            TownNews.BuildingWorkFinished(receivedAt - 20.minutes, TownBuildingKind.Farm, level = 2)
    }
}
