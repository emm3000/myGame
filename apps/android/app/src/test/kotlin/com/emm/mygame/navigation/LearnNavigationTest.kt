package com.emm.mygame.navigation

import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.control.OUTLINED_PILL
import com.emm.mygame.core.model.town.TownReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LearnNavigationTest : AppNavigationFixture() {

    @Test
    fun `Read the words on Learn's running lesson opens its words`() {
        signedInReading(TownReadResult.Read(runningTown()))
        repeat(2) { learning.answerRead(noReviews) }
        tab(LEARN_TAB).performClick()

        waitedFor(hasTestTag(OUTLINED_PILL) and hasText(READ_THE_WORDS) and hasAnyAncestor(hasScrollAction()))
            .performScrollTo()
            .performClick()

        waitForLine("I drink water.")
    }

    private companion object {
        const val LEARN_TAB: String = "Aprender"
        const val READ_THE_WORDS: String = "Leer las palabras"
    }
}
