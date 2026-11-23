package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.rememberNavBackStack
import com.emm.mygame.Destination
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.TownReadResult
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownExitNavigationTest : AppNavigationFixture() {

    @Test
    fun `shows nothing with no town`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        towns.answerRead(TownReadResult.NoTown)
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(Destination.Town, Destination.Report),
                )
            }
        }
        waitForLine("NOTICIAS DEL PUEBLO")

        assertNoStatus()
    }

    @Test
    fun `draws no back link on the town home`() {
        signedInAtTown()

        composeRule.onAllNodesWithText("Pueblo").assertCountEquals(0)
    }

    @Test
    fun `links back to the town from the reviews`() {
        signedInAtTown(town = reviewsDueTown)
        openReport(threeDue)
        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
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
        signedInAtTown()
        openReport(nothingDue)
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
        waitForLine("Volver a intentarlo")
        sessions.answerSignOut()
        sessions.answerRestore(RestoreResult.SignedOut)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        waitForLine("Entrar")
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `reads the Report again on the way back from the reviews`() {
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())))
        openReport(threeDue)
        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        reports.answerRead(ReportReadResult.Read(nothingDue))

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        waitForLine("No tienes repasos pendientes ahora.")

        assertEquals(2, reports.readCount)
    }

    @Test
    fun `keeps the Report shown when the header's town link is tapped while signing out`() {
        signedInAtTown()
        openReport(nothingDue)
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()

        link("Pueblo").performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Informe").and(isHeading())).assertExists()
    }
}
