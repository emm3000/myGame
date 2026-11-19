package com.emm.mygame.feature.school

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeTownRepository
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolTextRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private var noTownCount: Int = 0

    @Test
    fun `draws the text the route was opened on`() {
        towns.answerRead(TownReadResult.Read(townOf(texts = listOf(courseText))))

        showRoute()

        composeRule.waitUntil { isTitleShown() }
    }

    @Test
    fun `leaves for the town when the player holds none`() {
        towns.answerRead(TownReadResult.NoTown)

        showRoute()
        composeRule.waitForIdle()

        assertEquals(1, noTownCount)
    }

    private fun isTitleShown(): Boolean =
        composeRule.onAllNodes(isHeading() and hasText("A New Course")).fetchSemanticsNodes().isNotEmpty()

    private fun showRoute() {
        composeRule.setContent {
            MyGameTheme {
                SchoolTextRoute(
                    text = courseTextId,
                    towns = towns,
                    onNoTown = { noTownCount += 1 },
                    onSchoolOpen = {},
                )
            }
        }
    }
}
