package com.emm.mygame.feature.report

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant
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

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private var newsOpens: Int = 0

    private var settingsOpens: Int = 0

    private val unreadFarm: ReportUiState.ReportNews =
        ReportUiState.ReportNews.Unread(listOf(finishedFarm), ReportUiState.CloseRequest.Idle)

    private fun show(state: ReportUiState) {
        composeRule.setContent {
            MyGameTheme {
                ReportScreen(
                    state = state,
                    onIntent = { intents += it },
                    onReviewsOpen = { reviewOpens += 1 },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onNewsOpen = { newsOpens += 1 },
                    onSettingsOpen = { settingsOpens += 1 },
                )
            }
        }
    }

    private val localNoon: Instant = Instant.fromEpochMilliseconds(
        LocalDateTime.of(2026, 11, 5, 12, 0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    )

    private fun contentWith(
        dueCount: Int = 0,
        news: ReportUiState.ReportNews = ReportUiState.ReportNews.None,
        firstUnread: LessonId? = null,
        nextReview: Instant? = null,
        receivedAt: Instant = readInstant,
    ): ReportUiState.Content = ReportUiState.Content(
        dueCount = dueCount,
        firstUnread = firstUnread,
        nextReview = nextReview,
        news = news,
        receivedAt = receivedAt,
    )

    @Test
    fun `shows the next review's instant with no review due`() {
        show(contentWith(nextReview = localNoon, receivedAt = localNoon - 1.hours))

        composeRule.onNodeWithText("No tienes repasos pendientes ahora.").assertIsDisplayed()
        composeRule.onNodeWithText("Siguiente repaso:").assertIsDisplayed()
        composeRule.onNodeWithText("12:00").assertIsDisplayed()
    }

    @Test
    fun `shows no instant with no review ahead`() {
        show(contentWith())

        composeRule.onAllNodesWithText("Siguiente repaso:").assertCountEquals(0)
    }

    @Test
    fun `leaves the instant out while reviews are due`() {
        show(contentWith(dueCount = 3, nextReview = localNoon))

        composeRule.onAllNodesWithText("Siguiente repaso:").assertCountEquals(0)
    }

    @Test
    fun `titles every state`() {
        show(ReportUiState.Loading)

        composeRule.onNodeWithText("Informe").assertIsDisplayed().assert(isHeading())
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
    fun `opens the unread lesson from the Report`() {
        show(contentWith(dueCount = 3, firstUnread = unreadLesson))

        composeRule.onNodeWithText("Leer las palabras").performClick()

        assertEquals(listOf(unreadLesson), lessonOpens)
    }

    @Test
    fun `keeps the reviews behind the unread words`() {
        show(contentWith(dueCount = 3, firstUnread = unreadLesson))

        composeRule.onAllNodesWithText("Empezar los repasos").assertCountEquals(0)
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
        val newsTop: Float = topOf("NOTICIAS DEL PUEBLO")

        assertTrue(dueTop < newsTop)
    }

    @Test
    fun `lists no review due before the news`() {
        show(contentWith(dueCount = 0, news = unreadFarm))

        assertTrue(topOf("No tienes repasos pendientes ahora.") < topOf("NOTICIAS DEL PUEBLO"))
    }

    @Test
    fun `opens the news from its row on the Report`() {
        show(contentWith(news = unreadFarm))

        composeRule.onNodeWithText("Leer todas las noticias").performScrollTo().performClick()

        assertEquals(1, newsOpens)
    }

    @Test
    fun `offers the news row with no news unread`() {
        show(contentWith(news = ReportUiState.ReportNews.Closed))

        composeRule.onNodeWithText("Leer todas las noticias").performScrollTo().assertIsDisplayed()
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

    @Test
    fun `keeps sign-out at the foot of the Report`() {
        show(contentWith(dueCount = 1, news = unreadFarm))

        val signOutTop: Dp = unclippedTopOf("Salir")

        listOf("Repasos pendientes: 1", "NOTICIAS DEL PUEBLO", "Cerrar las noticias").forEach { line: String ->
            assertTrue(unclippedTopOf(line) < signOutTop)
        }
    }

    @Test
    fun `opens the settings from beside sign-out`() {
        show(contentWith(news = unreadFarm))

        composeRule.onNodeWithText("Ajustes").performScrollTo().performClick()

        assertEquals(1, settingsOpens)
    }

    @Test
    fun `keeps the settings on a Report that failed to read`() {
        show(ReportUiState.Failed)

        composeRule.onNodeWithText("Ajustes").performScrollTo().performClick()

        assertEquals(1, settingsOpens)
    }

    @Test
    fun `sets the settings beside sign-out at the foot of the Report`() {
        show(contentWith(dueCount = 1, news = unreadFarm))

        val settingsTop: Dp = unclippedTopOf("Ajustes")

        assertTrue(unclippedTopOf("Cerrar las noticias") < settingsTop)
        assertTrue(settingsTop < unclippedTopOf("Salir"))
    }

    @Test
    fun `keeps sign-out on a Report that failed to read`() {
        show(ReportUiState.Failed)

        composeRule.onNodeWithText("Salir").performScrollTo().performClick()

        assertEquals(listOf<ReportIntent>(ReportIntent.SignOutTapped), intents)
    }

    @Test
    fun `draws a text button while signing out, never an ink pill`() {
        show(ReportUiState.SigningOut)

        composeRule.onNodeWithText("Salir").assertIsDisplayed()
        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(0)
    }

    @Test
    fun `keeps the Report's block periwinkle`() {
        show(contentWith(dueCount = 3))

        composeRule.onNode(
            hasText("Repasos pendientes: 3") and
                hasAnyAncestor(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Periwinkle)),
        ).assertExists()
    }

    @Test
    fun `holds no pill inside a block`() {
        show(contentWith(dueCount = 3, news = unreadFarm))

        val inTheBlock: SemanticsMatcher = hasAnyAncestor(SemanticsMatcher.keyIsDefined(BLOCK_HUE))
        composeRule.onNode(SemanticsMatcher.keyIsDefined(BLOCK_HUE)).assertExists()
        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
        composeRule.onAllNodes(hasTestTag(INK_PILL) and inTheBlock).assertCountEquals(0)
        composeRule.onAllNodes(hasTestTag(OUTLINED_PILL) and inTheBlock).assertCountEquals(0)
    }

    @Test
    fun `sets the pill under the block`() {
        show(contentWith(dueCount = 3))

        val blockBottom: Dp = composeRule.onNode(SemanticsMatcher.keyIsDefined(BLOCK_HUE))
            .getUnclippedBoundsInRoot().bottom
        val pillTop: Dp = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().top

        assertTrue(blockBottom <= pillTop)
    }

    @Test
    fun `holds no pill with nothing due`() {
        show(contentWith(dueCount = 0, news = unreadFarm))

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(0)
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(BLOCK_HUE)).assertCountEquals(0)
    }

    @Test
    fun `holds one ink pill on a Report with reviews due and unread words`() {
        show(contentWith(dueCount = 3, news = unreadFarm, firstUnread = LessonId("lesson-1")))

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `holds at most one ink pill on a Report that failed to read`() {
        show(ReportUiState.Failed)

        assertTrue(composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size <= 1)
    }

    @Test
    fun `sets each news on a hairline row`() {
        val news = ReportUiState.ReportNews.Unread(listOf(finishedFarm, finishedFarm), ReportUiState.CloseRequest.Idle)
        show(contentWith(news = news))

        composeRule.onAllNodesWithTag(HAIRLINE).assertCountEquals(2)
    }

    @Test
    fun `sets the empty news on a hairline row`() {
        show(contentWith(news = ReportUiState.ReportNews.None))

        composeRule.onAllNodesWithTag(HAIRLINE).assertCountEquals(1)
    }

    private fun unclippedTopOf(line: String): Dp = composeRule.onNodeWithText(line).getUnclippedBoundsInRoot().top
}
