package com.emm.mygame.feature.town.building

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class NextLevelCardTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var sunken: Color = Color.Unspecified

    private val levelTwo: NextLevelLine = NextLevelLine(
        level = 2,
        costs = listOf(CostLine(TownResourceKind.Food, amount = 120, isShort = false)),
        duration = 3.minutes,
        people = 2,
        wordsNeeded = null,
    )

    @Test
    fun `draws the next level on surface-sunken in the light theme`() {
        show(next = levelTwo, darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(NEXT_LEVEL_CARD))
    }

    @Test
    fun `draws the next level on surface-sunken in the dark theme`() {
        show(next = levelTwo, darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(NEXT_LEVEL_CARD))
    }

    @Test
    fun `draws the people a level puts to work`() {
        show(next = levelTwo, darkTheme = false)

        composeRule.onNodeWithText("Gente trabajando: +2").assertExists()
    }

    @Test
    fun `draws no people line when the level needs none`() {
        show(next = levelTwo.copy(people = 0), darkTheme = false)

        composeRule.onAllNodesWithText("Gente trabajando", substring = true).assertCountEquals(0)
    }

    private fun show(next: NextLevelLine, darkTheme: Boolean) {
        composeRule.setContent {
            MyGameTheme(darkTheme = darkTheme) {
                sunken = MyGameTheme.colors.surfaceSunken
                NextLevel(
                    building = TownBuildingKind.Farm,
                    next = next,
                    block = null,
                    start = StartStatus.Idle,
                    onIntent = {},
                )
            }
        }
    }

    private fun mostDrawnColorOf(tag: String): Int {
        val image: ImageBitmap = composeRule.onNodeWithTag(tag).captureToImage()
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels.toList()
            .groupingBy { pixel: Int -> pixel }
            .eachCount()
            .maxBy { entry: Map.Entry<Int, Int> -> entry.value }
            .key
    }
}
