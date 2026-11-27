package com.emm.mygame.feature.school.text

import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.uitesting.outlinedDoorOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolTextScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolTextIntent> = mutableListOf()

    private var schoolOpens: Int = 0

    @Test
    fun `shows the text's title as a heading`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = null))

        composeRule.onNode(isHeading() and hasText("A New Course")).assertExists()
    }

    @Test
    fun `shows a word under 7 days with its gloss beside it`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = null))

        composeRule.onNode(hasText("river río", substring = true)).assertExists()
    }

    @Test
    fun `hides a stable word's gloss until the word is tapped`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = null))

        composeRule.onAllNodesWithText("casa", substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows a stable word's gloss on tap`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = houseTap))

        assertEquals(LocaleList("es"), localeOf("casa"))
    }

    @Test
    fun `shows a word's definition on tap from 30 days`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = fieldTap))

        assertEquals(LocaleList("en"), localeOf("open land"))
    }

    @Test
    fun `asks for the support of the tapped word`() {
        draw(SchoolTextUiState.Reading(courseText, tapped = null))

        composeRule.onNodeWithText("house").performScrollTo().performClick()

        assertEquals(listOf<SchoolTextIntent>(SchoolTextIntent.WordTapped(houseTap)), intents)
    }

    @Test
    fun `offers a retry when the text cannot be read`() {
        draw(SchoolTextUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performScrollTo().performClick()

        assertEquals(listOf<SchoolTextIntent>(SchoolTextIntent.RetryTapped), intents)
    }

    @Test
    fun `leads back to your lessons when the text is not open`() {
        draw(SchoolTextUiState.NotOpen)

        composeRule.onNode(outlinedDoorOf("Ir a tus lecciones"), useUnmergedTree = true)
            .performScrollTo()
            .performClick()

        assertEquals(1, schoolOpens)
    }

    private fun localeOf(support: String): LocaleList? {
        val node: SemanticsNode = composeRule.onNodeWithText(support).fetchSemanticsNode()
        val text: AnnotatedString = node.config[SemanticsProperties.Text].single()
        return text.spanStyles.single().item.localeList
    }

    private fun draw(state: SchoolTextUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolTextScreen(
                    state = state,
                    onIntent = { intent: SchoolTextIntent -> intents += intent },
                    onSchoolOpen = { schoolOpens += 1 },
                )
            }
        }
    }
}
