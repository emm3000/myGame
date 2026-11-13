package com.emm.mygame.feature.report

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import kotlin.time.Duration.Companion.days

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class ReportLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val dueWithNews: ReportUiState.Content = ReportUiState.Content(
        dueCount = 3,
        firstUnread = null,
        nextReview = null,
        news = ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Unreachable),
        receivedAt = readInstant,
    )

    private val nothingDueUntilTomorrow: ReportUiState.Content = dueWithNews.copy(
        dueCount = 0,
        nextReview = readInstant + 1.days,
    )

    private fun show(language: CopyLanguage, state: ReportUiState.Content = dueWithNews) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    ReportScreen(
                        state = state,
                        onIntent = {},
                        onReviewsOpen = {},
                        onLessonOpen = {},
                        onNewsOpen = {},
                        onSettingsOpen = {},
                    )
                }
            }
        }
    }

    private fun assertDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(1) }
    }

    private fun assertNotDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(0) }
    }

    private fun lineOf(text: String): DpRect =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot()

    private fun lineStarting(text: String): DpRect =
        composeRule.onNode(hasText(text, substring = true), useUnmergedTree = true).getUnclippedBoundsInRoot()

    @Test
    fun `draws the Report in Spanish in the Spanish phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold))

        assertDrawn("Informe", "Repasos pendientes: 3", "Empezar los repasos", "NOTICIAS DEL PUEBLO")
        assertDrawn("Granja: ahora en nivel 2.", "Cerrar las noticias", "Leer todas las noticias", "Salir")
        assertNotDrawn("Report", "Reviews due: 3", "Start the reviews", "TOWN NEWS", "Sign out")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both))

        assertDrawn("Report", "Informe", "Start the reviews", "Empezar los repasos", "Farm: now level 2.")
        assertDrawn("Granja: ahora en nivel 2.", "TOWN NEWS", "NOTICIAS DEL PUEBLO", "Read all the news")
        assertTrue(lineOf("Report").bottom <= lineOf("Informe").top)
        assertTrue(lineOf("Start the reviews").bottom <= lineOf("Empezar los repasos").top)
        assertTrue(lineOf("Close the news").bottom <= lineOf("Cerrar las noticias").top)
    }

    @Test
    fun `draws the next review's time in English over Spanish in the both phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both), nothingDueUntilTomorrow)

        assertTrue(lineStarting("tomorrow").bottom <= lineStarting("mañana").top)
    }

    @Test
    fun `draws a line both languages write alike once in the both phase`() {
        val copy: PlayerCopy =
            PlayerCopy(RuntimeEnvironment.getApplication(), CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both))

        assertEquals(MyGameLabel(text = "09:00", translation = null), copy.chrome { "09:00" })
    }

    @Test
    fun `writes a later day of the next review the English way in the English phase`() {
        val inThreeDays: ReportUiState.Content = nothingDueUntilTomorrow.copy(nextReview = readInstant + 3.days)

        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English), inThreeDays)

        composeRule.onNode(hasText("Nov 8", substring = true)).assertExists()
    }

    @Test
    fun `draws the Report in English in the English phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English))

        assertDrawn("Report", "Reviews due: 3", "Start the reviews", "TOWN NEWS", "Farm: now level 2.")
        assertDrawn("Close the news", "Read all the news")
        assertNotDrawn("Informe", "Repasos pendientes: 3", "Empezar los repasos", "NOTICIAS DEL PUEBLO")
    }

    @Test
    fun `draws sign-out in Spanish for an es player in the English phase`() {
        show(CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English))

        assertDrawn("Salir", "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
        assertNotDrawn("Sign out", "We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `draws every line in English under none`() {
        show(CopyLanguage(ScaffoldLanguage.None, ChromePhase.English))

        assertDrawn("Report", "Reviews due: 3", "Start the reviews", "TOWN NEWS", "Farm: now level 2.")
        assertDrawn("Sign out", "We could not reach the server. Try again in a moment.")
        assertNotDrawn("Informe", "Empezar los repasos", "NOTICIAS DEL PUEBLO", "Salir")
        assertNotDrawn("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
    }
}
