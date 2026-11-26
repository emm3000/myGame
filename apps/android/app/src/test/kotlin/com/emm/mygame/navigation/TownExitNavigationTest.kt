package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.Destination
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.town.TownReadResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownExitNavigationTest : AppNavigationFixture() {

    @Test
    fun `draws no back link on the town home`() {
        signedInAtTown()

        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(0)
    }

    @Test
    fun `links back to the town from the reviews`() {
        learning.answerRead(noReviews)
        showingStack(Destination.Today, Destination.Town, Destination.Review, town = reviewsDueTown)
        waitForLine("Aún no tienes palabras que repasar.")

        assertLinksBackToTheTown()
    }

    @Test
    fun `links back to the town from a lesson's words`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        assertLinksBackToTheTown()
    }

    @Test
    fun `signs out from the foot of the Report`() {
        showingTheReport(nothingDue)
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
    }

    @Test
    fun `signs out from the naming form`() {
        signedInReading(TownReadResult.NoTown)
        waitForLine("Ponle nombre a tu pueblo")
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `signs out from a failed town read`() {
        signedInReading(TownReadResult.Unreachable)
        tab("Pueblo").performClick()
        waitForLine("Volver a intentarlo")
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `keeps the Report shown when the header's town link is tapped while signing out`() {
        showingTheReport(nothingDue)
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        link("Pueblo").performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Informe").and(isHeading())).assertExists()
    }
}
