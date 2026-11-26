package com.emm.mygame.navigation

import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.Destination
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.jobs.RegionMap
import com.emm.mygame.core.model.town.jobs.RegionMapResult
import com.emm.mygame.core.model.town.jobs.Terrain
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ScreenOpeningNavigationTest : AppNavigationFixture() {

    @Test
    fun `opens the unread lesson's words from Today's first card`() {
        learning.answerRead(
            ReviewsReadResult.Read(
                DueReviews(due = emptyList(), readFirst = listOf(firstLesson), nextDueAt = null, readAt = readAt),
            ),
        )
        signedInReading(TownReadResult.Read(playedTown(nextStep = NextStep.Reviews(1, listOf(firstLesson)))))

        link("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the map from its row on the office's page`() {
        val firstArea: RegionMap =
            RegionMap(region = 1, area = 1, lastArea = 2, terrain = Terrain.Fields, sites = emptyList())
        towns.regions.answerMap(RegionMapResult.Read(firstArea))
        signedInAtTown()
        waitForLine("Oficina")
        composeRule.onNode(hasText("Oficina") and hasClickAction() and !isSelectable()).performScrollTo().performClick()

        composeRule.onNodeWithText("Ir al mapa").performScrollTo().performClick()

        waitForLine("Zona 1")
    }

    @Test
    fun `opens the news from its row on Today`() {
        sessions.answerRestore(verifiedSession)
        reports.answerRead(ReportReadResult.Read(nothingDue.copy(news = listOf(TownNews.LessonStopped(readAt)))))
        showingStack(Destination.Today)
        waitForLine("Leer todas las noticias")
        reports.answerNews(
            TownNewsReadResult.Read(listOf(TownNews.BuildingWorkFinished(readAt, TownBuildingKind.Homes, level = 2))),
        )

        composeRule.onNodeWithText("Leer todas las noticias").performScrollTo().performClick()

        waitForLine("Hogares: ahora en nivel 2.")
    }

    @Test
    fun `opens the next lesson of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))

        wayOn("Siguiente lección").performClick()

        waitForLine("We live in a town.")
    }

    @Test
    fun `opens the reviews at the end of the walk`() {
        onTheFirstLessonOfTheWalk(secondReadings = listOf(townWord))
        wayOn("Siguiente lección").performClick()
        waitForLine("We live in a town.")
        learning.answerRead(noReviews)

        wayOn("Empezar los repasos").performClick()

        waitForLine("Aún no tienes palabras que repasar.")
    }

    @Test
    fun `returns to the town from a walk's lesson with nothing to read`() {
        onTheFirstLessonOfTheWalk(secondReadings = emptyList())
        wayOn("Siguiente lección").performClick()
        waitForLine("Ahora no hay palabras para leer.")

        wayOn("Continuar").performClick()

        waitForLine(TOWN_HEADER)
    }
}
