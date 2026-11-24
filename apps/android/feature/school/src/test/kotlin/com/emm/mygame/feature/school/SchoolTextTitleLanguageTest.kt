package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolTextTitleLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val title: String = courseText.title

    private val openText: TownSnapshot.TextTitle = TownSnapshot.TextTitle(id = TextId("text-1"), title = title)

    private fun titleLocale(): LocaleList? {
        val line: AnnotatedString = composeRule.onNodeWithText(title, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsProperties.Text]
            .single()
        return line.spanStyles.single().item.localeList
    }

    @Test
    fun `reads a text row's title in English`() {
        val state: SchoolUiState = townOf(texts = listOf(openText))
            .contentAt(readInstant, Duration.ZERO, SchoolMutations.none, selected = null)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(state = state, onIntent = {}, onLessonOpen = {}, onTextOpen = {})
            }
        }

        assertEquals(LocaleList("en"), titleLocale())
    }

    @Test
    fun `reads the text page's title in English`() {
        composeRule.setContent {
            MyGameTheme {
                SchoolTextScreen(
                    state = SchoolTextUiState.Reading(courseText, tapped = null),
                    onIntent = {},
                    onSchoolOpen = {},
                )
            }
        }

        assertEquals(LocaleList("en"), titleLocale())
    }
}
