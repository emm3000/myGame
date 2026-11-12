package com.emm.mygame.feature.report

import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NewsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<NewsIntent> = mutableListOf()

    private val site: TownSite = TownSite(region = 1, area = 3, site = 12)

    private val pay: List<TownAmount> = listOf(TownAmount(TownResourceKind.Food, 40))

    private val refund: List<TownAmount> = listOf(TownAmount(TownResourceKind.Money, 60))

    private val receivedAt: Instant = localToday(10, 0)

    private val everyKind: List<Pair<TownNews, String>> = listOf(
        TownNews.BecameCity(localToday(9, 59)) to "Tu pueblo ahora es una ciudad.",
        TownNews.CleanUpFailed(localToday(9, 58), site) to
            "Tu equipo no pudo limpiar los residuos de la región 1, zona 3, sitio 12.",
        TownNews.CleanUpDone(localToday(9, 57), site, pay) to
            "Tu equipo limpió los residuos de la región 1, zona 3, sitio 12.",
        TownNews.JobCalledBack(localToday(9, 56), site, pay) to
            "Llamaste de vuelta a tu equipo de la región 1, zona 3, sitio 12.",
        TownNews.JobBack(localToday(9, 55), site, pay) to "Tu equipo volvió de la región 1, zona 3, sitio 12.",
        TownNews.HiringStopped(localToday(9, 54), TownHireKind.Worker, delivered = 2, stopped = 3, refund) to
            "Paraste la contratación de trabajadores: llegaron 2 de 5.",
        TownNews.HiringDelivered(localToday(9, 53), TownHireKind.Truck, count = 3) to "Contrataste 3 camiones.",
        TownNews.SkillEarned(localToday(9, 52), TownResourceKind.Food, ratePercent = 5) to
            "Ganaste una habilidad de comida: +5 % de comida.",
        TownNews.LessonStopped(localToday(9, 51)) to "Paraste el estudio de una lección.",
        TownNews.LessonStudied(localToday(9, 50)) to "Estudiaste una lección.",
        TownNews.BuildingWorkStopped(localToday(9, 49), TownBuildingKind.Homes, level = 3, refund) to
            "Paraste la obra: Hogares, nivel 3.",
        TownNews.BuildingWorkFinished(localToday(9, 48), TownBuildingKind.Farm, level = 2) to
            "Granja: ahora en nivel 2.",
    )

    private fun show(state: NewsUiState) {
        composeRule.setContent {
            MyGameTheme {
                NewsScreen(state = state, onIntent = { intent: NewsIntent -> intents += intent })
            }
        }
    }

    @Test
    fun `writes one line per event kind with its instant`() {
        show(NewsUiState.Content(everyKind.map { (news: TownNews, _) -> news }, receivedAt))

        val drawn: List<Pair<String, String>> = everyKind.map { (news: TownNews, line: String) ->
            val instant: String = "Hoy, " + clockOf(news.occurredAt)
            composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
            composeRule.onNodeWithText(instant).assertIsDisplayed()
            instant to line
        }

        assertEquals((59 downTo 48).map { minute: Int -> "Hoy, 09:$minute" }, drawn.map { it.first })
    }

    @Test
    fun `lists the newest first, in the order the server answers`() {
        val homes: TownNews = TownNews.BuildingWorkFinished(localToday(9, 45), TownBuildingKind.Homes, level = 2)
        val farm: TownNews = TownNews.BuildingWorkFinished(localToday(9, 30), TownBuildingKind.Farm, level = 3)
        show(NewsUiState.Content(listOf(homes, farm), receivedAt))

        assertEquals(true, topOf("Hogares: ahora en nivel 2.") < topOf("Granja: ahora en nivel 3."))
    }

    @Test
    fun `draws the news exactly as the server sends them, never sorted by time`() {
        val older: TownNews = TownNews.BuildingWorkFinished(localToday(9, 30), TownBuildingKind.Farm, level = 3)
        val newer: TownNews = TownNews.BuildingWorkFinished(localToday(9, 45), TownBuildingKind.Homes, level = 2)
        show(NewsUiState.Content(listOf(older, newer), receivedAt))

        assertEquals(true, topOf("Granja: ahora en nivel 3.") < topOf("Hogares: ahora en nivel 2."))
    }

    @Test
    fun `draws the pay under the news that carry one`() {
        val job: TownNews = TownNews.JobBack(localToday(9, 55), site, pay)
        show(NewsUiState.Content(listOf(job), receivedAt))

        assertEquals(true, topOf("Tu equipo volvió de la región 1, zona 3, sitio 12.") < topOf("Pago: 40 de comida"))
    }

    @Test
    fun `draws the refund under a stopped work`() {
        val stop: TownNews = TownNews.BuildingWorkStopped(localToday(9, 49), TownBuildingKind.Homes, level = 3, refund)
        show(NewsUiState.Content(listOf(stop), receivedAt))

        assertEquals(true, topOf("Paraste la obra: Hogares, nivel 3.") < topOf("Recuperaste: 60 de dinero"))
    }

    @Test
    fun `draws no refund line for a stop that cost nothing`() {
        val stop: TownNews =
            TownNews.BuildingWorkStopped(localToday(9, 49), TownBuildingKind.Homes, level = 3, refund = emptyList())
        show(NewsUiState.Content(listOf(stop), receivedAt))

        composeRule.onAllNodesWithText("Recuperaste", substring = true).assertCountEquals(0)
    }

    @Test
    fun `sets each news on a hairline row`() {
        show(NewsUiState.Content(everyKind.take(2).map { (news: TownNews, _) -> news }, receivedAt))

        composeRule.onAllNodesWithTag(HAIRLINE).assertCountEquals(2)
    }

    @Test
    fun `says there is no news when the town has none`() {
        show(NewsUiState.Content(emptyList(), receivedAt))

        composeRule.onNodeWithText("No hay noticias.").assertIsDisplayed()
    }

    @Test
    fun `titles every state`() {
        show(NewsUiState.Failed)

        composeRule.onNodeWithText("Noticias del pueblo").assertIsDisplayed().assert(isHeading())
    }

    @Test
    fun `speaks the loading line while the news reads`() {
        composeRule.mainClock.autoAdvance = false
        show(NewsUiState.Loading)

        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + FRAME_MARGIN)

        composeRule.onNodeWithContentDescription("Estamos leyendo las noticias…").assertExists()
    }

    @Test
    fun `offers the retry on a failed read`() {
        show(NewsUiState.Failed)

        composeRule.onNodeWithText("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.")
            .assertIsDisplayed()
        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<NewsIntent>(NewsIntent.RetryTapped), intents)
    }

    @Test
    fun `draws no news while the read failed`() {
        show(NewsUiState.Failed)

        composeRule.onAllNodesWithText("No hay noticias.").assertCountEquals(0)
    }

    private fun topOf(line: String): Float =
        composeRule.onNodeWithText(line).fetchSemanticsNode().boundsInRoot.top

    private fun localToday(hour: Int, minute: Int): Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 10, hour, minute).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private fun clockOf(instant: Instant): String = java.time.LocalTime
        .ofInstant(java.time.Instant.ofEpochMilli(instant.toEpochMilliseconds()), ZoneId.systemDefault())
        .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))

    private companion object {
        const val FRAME_MARGIN: Long = 32
    }
}
