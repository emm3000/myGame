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
    fun `signs out from the foot of Me`() {
        onMe()

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `keeps Me shown when the town tab is tapped while signing out`() {
        onMe()
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        tab("Pueblo").performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Ajustes").and(isHeading())).assertExists()
    }

    private fun onMe() {
        signedInAtTown()
        tab("Yo").performClick()
        waitForLine("Salir")
    }
}
