package com.emm.mygame.navigation

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import com.emm.mygame.Destination
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import com.emm.mygame.core.model.town.school.RetainedWords
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private val ringWording: Regex = Regex("\\d+ de \\d+ palabras? aprendidas?")

private val ringLine: SemanticsMatcher = SemanticsMatcher("the ring's line") { node ->
    node.config.getOrElseNullable(SemanticsProperties.Text) { null }
        .orEmpty()
        .any { line -> ringWording.matches(line.text) }
}

@RunWith(RobolectricTestRunner::class)
class RetainedWordsRingNavigationTest : AppNavigationFixture() {

    @Test
    fun `hides the ring while the count is null`() {
        signedInAtTown(town = playedTown(retainedWords = null))

        composeRule.onAllNodes(ringLine).assertCountEquals(0)
    }

    @Test
    fun `shows the retained words in the ring`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `shows the ring on a screen under the town home`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))
        composeRule.onNode(hasText("Escuela") and hasClickAction() and !isSelectable()).performScrollTo().performClick()
        composeRule.onNodeWithText("Ir a tus lecciones").performScrollTo().performClick()
        waitForLine("Palabras en aprendizaje: 0 de 10")

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    @Test
    fun `reads the count to TalkBack once`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))

        composeRule.onAllNodesWithText(THREE_OF_FIVE).assertCountEquals(1)
    }

    @Test
    fun `names a lesson of one word in the singular`() {
        signedInAtTown(town = playedTown(retainedWords = RetainedWords(count = 0, total = 1)))

        ring("0 de 1 palabra aprendida").assertIsDisplayed()
    }

    @Test
    fun `adds no ring read to a screen that reads the town`() {
        signedInAtTown(town = playedTown(retainedWords = threeOfFive))
        composeRule.onNode(hasText("Escuela") and hasClickAction() and !isSelectable()).performScrollTo().performClick()
        composeRule.waitForIdle()
        val readsOnTheTown: Int = towns.readCount

        composeRule.onNodeWithText("Ir a tus lecciones").performScrollTo().performClick()
        waitForLine("Palabras en aprendizaje: 0 de 10")

        assertEquals(readsOnTheTown + 1, towns.readCount)
    }

    @Test
    fun `reads the town for the ring over a screen that reads none`() {
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(playedTown(retainedWords = threeOfFive))) }

        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Today, Destination.Town, Destination.News),
                )
            }
        }
        waitForRing(THREE_OF_FIVE)

        assertEquals(READS_ON_ARRIVAL, towns.readCount)
    }

    @Test
    fun `draws a count fallen back on a screen that reads none`() {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(READS_ON_ARRIVAL) { towns.answerRead(TownReadResult.Read(playedTown(retainedWords = threeOfFive))) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(dependencies = dependencies, reminderTaps = emptyFlow(), mailedLinks = emptyFlow())
            }
        }
        waitForRing(THREE_OF_FIVE)
        towns.answerRead(TownReadResult.Read(playedTown(retainedWords = RetainedWords(count = 2, total = 5))))

        tab("Yo").performClick()

        waitForRing("2 de 5 palabras aprendidas")
    }
}
