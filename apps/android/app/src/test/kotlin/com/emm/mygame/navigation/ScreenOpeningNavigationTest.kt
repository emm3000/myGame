package com.emm.mygame.navigation

import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.PILL_BADGE
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.placement.Placement
import com.emm.mygame.core.model.placement.PlacementReadResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.jobs.RegionMap
import com.emm.mygame.core.model.town.jobs.RegionMapResult
import com.emm.mygame.core.model.town.jobs.Terrain
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ScreenOpeningNavigationTest : AppNavigationFixture() {

    @Test
    fun `opens the unread lesson's words from the next step on the town home`() {
        learning.answerRead(
            ReviewsReadResult.Read(
                DueReviews(due = emptyList(), readFirst = listOf(firstLesson), nextDueAt = null, readAt = readAt),
            ),
        )
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(1, listOf(firstLesson))))

        dockGo("Leer las palabras").performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `opens the Report from the next step on the town home`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        signedInAtTown()

        dockGo("Ir al informe").performClick()

        waitForLine("No tienes repasos pendientes ahora.")
    }

    @Test
    fun `opens the map from its row on the town home`() {
        val firstArea: RegionMap =
            RegionMap(region = 1, area = 1, lastArea = 2, terrain = Terrain.Fields, sites = emptyList())
        towns.regions.answerMap(RegionMapResult.Read(firstArea))
        signedInAtTown()
        composeRule
            .onNode(
                SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)
                    .and(hasContentDescription("Oficina", substring = true)),
            )
            .performScrollTo()
            .performClick()

        composeRule.onNodeWithText("Ir al mapa").performScrollTo().performClick()

        waitForLine("Zona 1")
    }

    @Test
    fun `opens the placement from its row on the town home`() {
        repeat(2) { placements.answerRead(PlacementReadResult.Read(Placement.Offered)) }
        signedInAtTown()
        waitForLine("Hacer la prueba de nivel")

        composeRule.onNodeWithText("Hacer la prueba de nivel").performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText("Empezar la prueba"))
                .fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun `opens the Report from its row on the town home`() {
        signedInAtTown()

        openReport(threeDue)

        composeRule.onNodeWithText("Repasos pendientes: 3").assertIsDisplayed()
    }

    @Test
    fun `opens the news from its row on the Report`() {
        signedInAtTown()
        openReport(nothingDue)
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

    @Test
    fun `opens the reviews from the Report`() {
        signedInAtTown(town = reviewsDueTown)
        openReport(threeDue)
        learning.answerRead(noReviews)

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learning.readCount)
    }

    @Test
    fun `opens the reviews from the school's dock past the learning cap`() {
        signedInAtTown(
            town = playedTown(inLearning = 8, nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())),
        )
        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        waitForLine("La siguiente lección trae 5 palabras. Empieza los repasos.")
        learning.answerRead(noReviews)

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        assertEquals(1, learning.readCount)
    }

    @Test
    fun `shows a running lesson's time in the status strip on every signed-in screen but the school`() {
        signedInAtTown(town = runningTown().copy(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())))
        assertStatusShown()

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()
        assertStudyingShownWithoutStatus()
        tab("Pueblo").performClick()
        wayToTheReport().performScrollTo()

        openReport(threeDue)
        assertStatusShown()

        learning.answerRead(noReviews)
        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")
        assertStatusShown()
    }

    @Test
    fun `draws the due count on the go button`() {
        signedInAtTown(town = playedTown(nextStep = NextStep.Reviews(3, emptyList())))

        composeRule.onNode(SemanticsMatcher.expectValue(PILL_BADGE, "3")).assertIsDisplayed()
    }

    @Test
    fun `shows no count with nothing due`() {
        signedInAtTown()

        wayToTheReport().assertIsDisplayed()
        composeRule.onAllNodes(hasContentDescription("Repasos pendientes", substring = true)).assertCountEquals(0)
    }

    @Test
    fun `draws no count on the go button with nothing due`() {
        signedInAtTown()

        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(PILL_BADGE)).assertCountEquals(0)
    }
}
