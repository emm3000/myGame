package com.emm.mygame.feature.school

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LessonWordsRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val screenOwner: ScreenOwner = ScreenOwner()

    private val lessonOpenings: MutableList<Pair<LessonId, List<LessonId>>> = mutableListOf()

    private var noTownCount: Int = 0

    private val twoWords: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = listOf(homeWord, waterWord))))

    private val oneWordLeft: TownSnapshot = townOf(lessons = listOf(lessonOf(readings = listOf(waterWord))))

    private fun showRoute(walked: List<LessonId> = emptyList()) {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
                MyGameTheme {
                    LessonWordsRoute(
                        walk = LessonWalk(firstLesson, walked),
                        towns = towns,
                        reports = reports,
                        clock = Clock.System,
                        navigation = LessonWordsNavigation(
                            onNoTown = { noTownCount += 1 },
                            onLessonOpen = { lesson: LessonId, opened: List<LessonId> ->
                                lessonOpenings += lesson to opened
                            },
                            onReviewsOpen = {},
                            onSchoolOpen = {},
                        ),
                    )
                }
            }
        }
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        composeRule.waitForIdle()
    }

    private fun answerReads(town: TownSnapshot, readFirst: List<LessonId> = emptyList()) {
        towns.answerRead(TownReadResult.Read(town))
        reports.answerRead(readReportOf(readFirst))
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    @Test
    fun `reads again once on return from the background`() {
        answerReads(twoWords)
        showRoute()
        waitForLine("Palabra 1 de 2")
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.CREATED) }
        answerReads(oneWordLeft)

        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        waitForLine("Palabra 1 de 1")

        assertEquals(listOf(2, 2), listOf(towns.readCount, reports.readCount))
    }

    @Test
    fun `reads nothing more while the app stays in the foreground`() {
        answerReads(twoWords)
        showRoute()
        waitForLine("Palabra 1 de 2")

        composeRule.waitForIdle()

        assertEquals(listOf(1, 1), listOf(towns.readCount, reports.readCount))
    }

    @Test
    fun `hands a town that is gone to the navigation`() {
        towns.answerRead(TownReadResult.NoTown)

        showRoute()
        composeRule.waitUntil { noTownCount == 1 }

        assertEquals(1, noTownCount)
    }

    @Test
    fun `hands the opened lessons to the next lesson of the walk`() {
        val walkedBefore: LessonId = LessonId("lesson-9")
        answerReads(twoWords, readFirst = listOf(firstLesson, secondLesson))
        showRoute(walked = listOf(walkedBefore))
        waitForLine("Siguiente lección")

        composeRule.onNodeWithText("Siguiente lección").performScrollTo().performClick()

        assertEquals(listOf(secondLesson to listOf(walkedBefore, firstLesson)), lessonOpenings)
    }

    private class ScreenOwner : LifecycleOwner {

        private val registry: LifecycleRegistry = LifecycleRegistry.createUnsafe(this)

        override val lifecycle: Lifecycle
            get() = registry

        fun move(state: Lifecycle.State) {
            registry.currentState = state
        }
    }
}
