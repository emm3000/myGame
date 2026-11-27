package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.NAVIGATION_BAR
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.testing.FakeSessionRepository
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController

@RunWith(RobolectricTestRunner::class)
class SignOutRebuildTest {

    @get:Rule
    val composeRule: ComposeTestRule = createEmptyComposeRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val dependencies: AppDependencies = dependenciesOf(sessions = sessions)

    @After
    fun forgetTheHostContent() {
        RebuildHostActivity.shown = null
    }

    private fun signingOutOnARecreatedMe() {
        RebuildHostActivity.shown =
            RebuildHostActivity.Shown(dependencies, listOf(Destination.Today, Destination.Settings))
        val host: ActivityController<RebuildHostActivity> =
            Robolectric.buildActivity(RebuildHostActivity::class.java).setup()
        waitForLine("Salir")
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
        composeRule.runOnIdle { host.recreate() }
        composeRule.waitForIdle()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun `opens the links for the next session once a sign-out survives a recreation`() {
        signingOutOnARecreatedMe()

        repeat(SIGNED_OUT_READS) { sessions.answerRestore(RestoreResult.SignedOut) }
        sessions.answerSignOut()
        waitForLine("Entra en tu pueblo")
        composeRule.onNodeWithText("Crea tu cuenta").performScrollTo().performClick()
        waitForLine("¿Ya tienes cuenta?")
        composeRule.onNodeWithText("Entra").performScrollTo().performClick()

        waitForLine("¿Aún no tienes cuenta?")
    }

    @Test
    fun `keeps the town tab shut when the activity is recreated mid-sign-out`() {
        signingOutOnARecreatedMe()

        composeRule.onNode(townTab).performClick()
        composeRule.waitForIdle()

        composeRule.onNode(hasText("Yo").and(isHeading())).assertExists()
    }

    private val townTab: SemanticsMatcher =
        hasContentDescription("Pueblo").and(hasAnyAncestor(hasTestTag(NAVIGATION_BAR))).and(hasClickAction())

    private companion object {
        const val WAIT_MILLIS: Long = 5_000
        const val SIGNED_OUT_READS: Int = 3
    }
}
