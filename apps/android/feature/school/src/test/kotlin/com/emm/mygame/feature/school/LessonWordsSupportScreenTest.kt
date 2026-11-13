package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.TownSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LessonWordsSupportScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<LessonWordsIntent> = mutableListOf()

    @Test
    fun `shows the word's gloss beside it under 7 days`() {
        draw(readingOf(homeWord))

        composeRule.onNode(hasText("home hogar")).assertExists()
    }

    @Test
    fun `lets the screen reader reach the word as a heading when its support is on tap`() {
        draw(readingOf(drinkWaterWord(aguaOnTap)))

        val heading: SemanticsNode = composeRule.onNode(isHeading() and hasText("water")).fetchSemanticsNode()
        assertEquals("water", heading.config[SemanticsProperties.Text].joinToString())
        assertTrue(heading.config.isMergingSemanticsOfDescendants)
    }

    @Test
    fun `hides the word's gloss on tap until the word is tapped`() {
        draw(readingOf(drinkWaterWord(aguaOnTap)))

        composeRule.onNode(hasText("water") and hasClickAction()).assertExists()
        composeRule.onAllNodesWithText("agua", substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows the word's gloss on tap from 7 days`() {
        draw(readingOf(drinkWaterWord(aguaOnTap), LessonWordsUiState.ShownSupport.Word))

        composeRule.onNodeWithText("agua").assertExists()
    }

    @Test
    fun `shows the word's definition on tap from 30 days`() {
        draw(readingOf(drinkWaterWord(waterDefinitionOnTap), LessonWordsUiState.ShownSupport.Word))

        assertEquals(LocaleList("en"), localeOf("clear liquid that people drink"))
    }

    @Test
    fun `shows the gloss of a frame word on tap`() {
        draw(readingOf(drinkWaterWord(aguaOnTap), LessonWordsUiState.ShownSupport.Frame(spanIndex = 1)))

        assertEquals(LocaleList("es"), localeOf("beber"))
    }

    @Test
    fun `asks for the support of the word itself on a tap`() {
        draw(readingOf(drinkWaterWord(aguaOnTap)))

        composeRule.onNode(hasText("water") and hasClickAction()).performClick()

        assertEquals(
            listOf<LessonWordsIntent>(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word)),
            intents,
        )
    }

    @Test
    fun `asks for the support of a frame word on a tap`() {
        draw(readingOf(drinkWaterWord(aguaOnTap)))

        composeRule.onNodeWithText("drink").performClick()

        assertEquals(
            listOf<LessonWordsIntent>(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(1))),
            intents,
        )
    }

    @Test
    fun `draws a span without support as plain text`() {
        draw(readingOf(homeWord))

        composeRule.onNode(hasText("This is my home.")).assertExists()
        composeRule.onAllNodes(hasClickAction() and hasText("This is my home.")).assertCountEquals(0)
    }

    @Test
    fun `draws a word the server sent no support for with no gloss`() {
        draw(readingOf(drinkWaterWord(ownSupport = null)))

        composeRule.onNode(hasText("water") and hasClickAction().not()).assertExists()
        composeRule.onAllNodesWithText("agua", substring = true).assertCountEquals(0)
    }

    private fun localeOf(support: String): LocaleList? {
        val node: SemanticsNode = composeRule.onNodeWithText(support).fetchSemanticsNode()
        val text: AnnotatedString = node.config[SemanticsProperties.Text].single()
        return text.spanStyles.single().item.localeList
    }

    private fun readingOf(
        word: TownSnapshot.WordReading,
        shownSupport: LessonWordsUiState.ShownSupport? = null,
    ): LessonWordsUiState.Reading = LessonWordsUiState.Reading(
        name = LessonName.Shelved(number = 1),
        theme = "A day in town",
        words = listOf(word),
        index = 0,
        remaining = null,
        wayOn = LessonWordsUiState.WayOn.Reviews,
        shownSupport = shownSupport,
    )

    private fun draw(state: LessonWordsUiState) {
        composeRule.setContent {
            MyGameTheme {
                LessonWordsScreen(
                    state = state,
                    onIntent = { intent: LessonWordsIntent -> intents += intent },
                    onWayOn = { },
                    onSchoolOpen = { },
                )
            }
        }
    }
}
