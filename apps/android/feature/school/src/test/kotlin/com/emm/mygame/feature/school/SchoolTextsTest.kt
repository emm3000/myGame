package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.AnnotatedString
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.uitesting.outlinedDoorOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration

@RunWith(RobolectricTestRunner::class)
class SchoolTextsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val textOpens: MutableList<TextId> = mutableListOf()

    private val newerText: TownSnapshot.TextTitle = textTitleOf(id = "text-2", title = "The Farm Road")

    private val olderText: TownSnapshot.TextTitle = textTitleOf(id = "text-1", title = "A New Course")

    @Test
    fun `lists the open texts newest first`() {
        showSchoolOf(townOf(texts = listOf(newerText, olderText)))

        assertEquals(listOf("The Farm Road", "A New Course"), titlesInOrder())
    }

    @Test
    fun `shows no text list while no text is open`() {
        showSchoolOf(townOf(texts = emptyList()))

        composeRule.onAllNodesWithText("Para leer").assertCountEquals(0)
    }

    @Test
    fun `opens the text the player taps`() {
        showSchoolOf(townOf(texts = listOf(newerText, olderText)))

        composeRule.onNode(outlinedDoorOf("A New Course"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(listOf(TextId("text-1")), textOpens)
    }

    private fun showSchoolOf(town: TownSnapshot) {
        val state: SchoolUiState = town.contentAt(readInstant, Duration.ZERO, SchoolRequests.none, selected = null)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = {},
                    onLessonOpen = { _: LessonId -> },
                    onTextOpen = { text: TextId -> textOpens += text },
                    onReviewsOpen = {},
                )
            }
        }
    }

    private fun titlesInOrder(): List<String> = composeRule
        .onAllNodes(hasText("The Farm Road") or hasText("A New Course"), useUnmergedTree = true)
        .fetchSemanticsNodes()
        .flatMap { node: SemanticsNode -> node.config[SemanticsProperties.Text] }
        .map { title: AnnotatedString -> title.text }

    private fun textTitleOf(id: String, title: String): TownSnapshot.TextTitle =
        TownSnapshot.TextTitle(id = TextId(id), title = title)
}
