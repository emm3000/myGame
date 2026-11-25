package com.emm.mygame

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckChangeResult
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.holdout.HoldoutChecksReadResult
import com.emm.mygame.core.model.learning.DueReview
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewVerdict
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.Placement
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementChangeResult
import com.emm.mygame.core.model.placement.PlacementReadResult
import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.feature.town.status.TOWN_DOCK
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownReadAgainNavigationTest : DockFrameFixture() {

    @Test
    fun `a review answer reads the town again`() {
        val recall: DueReview.Recall = DueReview.Recall(
            wordId = WordId("lesson-1-1"),
            lesson = firstLesson,
            dueAt = readAt,
            gloss = "casa",
            gappedFrame = listOf(FrameSpan(text = "She goes ___ at six.", support = null)),
        )
        learning.answerRead(ReviewsReadResult.Read(noCards.copy(due = listOf(recall))))
        learning.answerReview(
            ReviewAnswerResult.Answered(ReviewVerdict.Wrong(word = "home", gloss = "casa", dueAt = readAt)),
        )
        showing(Destination.Today, Destination.Town, Destination.Review)
        waitFor(hasSetTextAction())

        composeRule.onNode(hasSetTextAction()).performTextInput("house")
        composeRule.onNode(hasTestTag(INK_PILL).and(hasText("Comprobar"))).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.sentAfterNowCount == 1 }
    }

    @Test
    fun `closing the news reads the town again`() {
        reports.answerRead(ReportReadResult.Read(nothingDue.copy(news = listOf(TownNews.LessonStopped(readAt)))))
        reports.answerClose(ReportCloseResult.Closed)
        showing(Destination.Today, Destination.Town, Destination.Report)
        waitFor(hasText(CLOSE_NEWS))

        composeRule.onNode(hasText(CLOSE_NEWS)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.sentAfterNowCount == 1 }
    }

    private fun skippingThePlacement() {
        placements.answerRead(PlacementReadResult.Read(Placement.Offered))
        placements.answerChange(PlacementChangeResult.Changed(Placement.Closed(emptyList())))
        showing(Destination.Today, Destination.Town, Destination.Placement)
        waitFor(hasText(SKIP_PLACEMENT))
        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)

        composeRule.onNode(hasText(SKIP_PLACEMENT)).performScrollTo().performClick()
    }

    @Test
    fun `the end of the placement reads the town again`() {
        skippingThePlacement()

        composeRule.waitUntil(WAIT_MILLIS) { towns.sentAfterNowCount == 1 }
    }

    @Test
    fun `the end of a holdout check reads the town again`() {
        val due: HoldoutCheck = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(due)))
        holdoutChecks.answerChange(HoldoutCheckChangeResult.Changed(emptyList()))
        showing(
            Destination.Today,
            Destination.Town,
            Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )
        waitFor(hasText(SKIP_PLACEMENT))

        composeRule.onNode(hasText(SKIP_PLACEMENT)).performScrollTo().performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.sentAfterNowCount == 1 }
    }

    @Test
    fun `starting a lesson reads the town again`() {
        val studying: TownSnapshot = playedTown(nextStep = NextStep.LessonRunning(goal = null, text = null))
        towns.answerLesson(TownLessonResult.Answered(studying))
        showing(
            Destination.Today,
            Destination.Town,
            Destination.School,
            town = playedTown(nextStep = NextStep.LessonToStudy(firstLesson)),
        )

        dockGo("Estudiar la lección 1 · 5:00").performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.sentAfterNowCount == 1 }
    }

    private companion object {
        const val SKIP_PLACEMENT: String = "Saltar la prueba"
        const val CLOSE_NEWS: String = "Cerrar las noticias"
    }
}
