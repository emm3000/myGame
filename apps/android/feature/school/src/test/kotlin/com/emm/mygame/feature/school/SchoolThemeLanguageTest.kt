package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolThemeLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val theme: String = "A day in town"

    private val otherLesson: TownSnapshot.Lesson = lessonOf(theme = "Greetings")

    private fun show(town: TownSnapshot) {
        val state: SchoolUiState =
            town.contentAt(readInstant, Duration.ZERO, SchoolRequests.none, selected = firstLesson)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(state = state, onIntent = {}, onLessonOpen = {}, onTextOpen = {}, onReviewsOpen = {})
            }
        }
    }

    private fun themeLocale(): LocaleList? {
        val line: AnnotatedString = composeRule.onNodeWithText(theme, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsProperties.Text]
            .single()
        return line.spanStyles.single().item.localeList
    }

    @Test
    fun `reads a lesson row's theme in English`() {
        show(townOf(lessons = listOf(otherLesson, lessonOf(id = secondLesson, theme = theme))))

        assertEquals(LocaleList("en"), themeLocale())
    }

    @Test
    fun `reads a studied lesson's theme in English`() {
        show(
            townOf(
                lessons = listOf(
                    lessonOf(id = secondLesson, isStudied = true, theme = theme),
                    otherLesson,
                ),
            ),
        )

        assertEquals(LocaleList("en"), themeLocale())
    }

    @Test
    fun `reads the shown lesson's theme in English`() {
        show(townOf(lessons = listOf(lessonOf(requiredSchoolLevel = 2, theme = theme))))

        assertEquals(LocaleList("en"), themeLocale())
    }
}
