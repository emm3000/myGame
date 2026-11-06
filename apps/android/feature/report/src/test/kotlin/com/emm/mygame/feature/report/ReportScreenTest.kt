package com.emm.mygame.feature.report

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReportScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<ReportIntent> = mutableListOf()

    private var reviewOpens: Int = 0

    private val unreadFarm: ReportUiState.ReportNews =
        ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Idle)

    private fun show(state: ReportUiState) {
        composeRule.setContent {
            MyGameTheme {
                ReportScreen(state = state, onIntent = { intents += it }, onReviewsOpen = { reviewOpens += 1 })
            }
        }
    }

    private fun contentWith(
        dueCount: Int = 0,
        news: ReportUiState.ReportNews = ReportUiState.ReportNews.None,
    ): ReportUiState.Content = ReportUiState.Content(dueCount = dueCount, news = news, receivedAt = readInstant)

    @Test
    fun `titles every state`() {
        show(ReportUiState.Loading)

        composeRule.onNodeWithText("Informe").assertIsDisplayed().assert(isHeading())
    }

    @Test
    fun `draws the reading line while loading`() {
        show(ReportUiState.Loading)

        composeRule.onNodeWithText("Estamos leyendo tu informe…").assertIsDisplayed()
    }

    @Test
    fun `offers the retry on a failed read`() {
        show(ReportUiState.Failed)

        composeRule.onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<ReportIntent>(ReportIntent.RetryTapped), intents)
    }

    @Test
    fun `draws the reviews due with their count`() {
        show(contentWith(dueCount = 3))

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `reads one review due`() {
        show(contentWith(dueCount = 1))

        composeRule.onNodeWithText("Repasos pendientes: 1").assertIsDisplayed()
    }

    @Test
    fun `groups a large count of reviews due`() {
        show(contentWith(dueCount = 1200))

        composeRule.onNodeWithText("Repasos pendientes: 1 200").assertIsDisplayed()
    }

    @Test
    fun `opens the reviews from the Report`() {
        show(contentWith(dueCount = 3))

        composeRule.onNodeWithText("Empezar los repasos").performClick()

        assertEquals(1, reviewOpens)
    }

    @Test
    fun `draws no way into the reviews when none is due`() {
        show(contentWith(dueCount = 0))

        composeRule.onNodeWithText("No tienes repasos pendientes ahora.").assertIsDisplayed()
        composeRule.onAllNodesWithText("Empezar los repasos").assertCountEquals(0)
    }

    @Test
    fun `lists the reviews due before the news`() {
        show(contentWith(dueCount = 3, news = unreadFarm))

        val dueTop: Float = topOf("Repasos pendientes: 3")
        val newsTop: Float = topOf("Noticias del pueblo")

        assertTrue(dueTop < newsTop)
    }

    @Test
    fun `lists no review due before the news`() {
        show(contentWith(dueCount = 0, news = unreadFarm))

        assertTrue(topOf("No tienes repasos pendientes ahora.") < topOf("Noticias del pueblo"))
    }

    @Test
    fun `draws each news with its instant and line`() {
        show(contentWith(news = unreadFarm))

        composeRule.onNodeWithText("Granja: ahora en nivel 2.").assertIsDisplayed()
        composeRule.onNodeWithText(todayLabel()).assertIsDisplayed()
    }

    @Test
    fun `lists the news in the order the api answers`() {
        val unread = ReportUiState.ReportNews.Unread(
            listOf(stoppedLesson, finishedFarm),
            ReportUiState.CloseRequest.Idle,
        )
        show(contentWith(news = unread))

        assertTrue(topOf("Paraste el estudio de una lección.") < topOf("Granja: ahora en nivel 2."))
    }

    @Test
    fun `draws the pay under the news that carry one`() {
        val site = TownSite(region = 1, area = 2, site = 3)
        val job: TownNews = TownNews.JobBack(readInstant, site, listOf(TownAmount(TownResourceKind.Food, 40)))
        show(contentWith(news = ReportUiState.ReportNews.Unread(listOf(job), ReportUiState.CloseRequest.Idle)))

        assertTrue(topOf("Tu equipo volvió de la región 1, zona 2, sitio 3.") < topOf("Pago: 40 de comida"))
    }

    @Test
    fun `draws the empty line when nothing is new`() {
        show(contentWith())

        composeRule.onNodeWithText("No hay noticias.").assertIsDisplayed()
    }

    @Test
    fun `offers no close when nothing is new`() {
        show(contentWith())

        composeRule.onAllNodesWithText("Cerrar las noticias").assertCountEquals(0)
    }

    @Test
    fun `sends the close from the news`() {
        show(contentWith(news = unreadFarm))

        composeRule.onNodeWithText("Cerrar las noticias").performScrollTo().performClick()

        assertEquals(listOf<ReportIntent>(ReportIntent.CloseTapped), intents)
    }

    @Test
    fun `sends nothing more while the close waits`() {
        val waiting = ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Waiting)
        show(contentWith(news = waiting))

        composeRule.onNodeWithText("Cerrar las noticias").performScrollTo().performClick()

        assertEquals(emptyList<ReportIntent>(), intents)
    }

    @Test
    fun `draws the outage of a close beside the news`() {
        val refused = ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Unreachable)
        show(contentWith(news = refused))

        composeRule.onNodeWithText("Granja: ahora en nivel 2.").assertIsDisplayed()
        composeRule.onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws no outage while the close is idle`() {
        show(contentWith(news = unreadFarm))

        composeRule.onAllNodesWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertCountEquals(0)
    }

    @Test
    fun `announces the news closed`() {
        show(contentWith(news = ReportUiState.ReportNews.Closed))

        composeRule.onNodeWithText("Cerraste las noticias.")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `offers no close once the news are closed`() {
        show(contentWith(news = ReportUiState.ReportNews.Closed))

        composeRule.onAllNodesWithText("Cerrar las noticias").assertCountEquals(0)
    }

    private fun topOf(line: String): Float =
        composeRule.onNodeWithText(line).fetchSemanticsNode().boundsInRoot.top

    private fun todayLabel(): String {
        val time: String = java.time.LocalTime
            .ofInstant(java.time.Instant.ofEpochSecond(readInstant.epochSeconds), java.time.ZoneId.systemDefault())
            .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))
        return "Hoy, $time"
    }
}
