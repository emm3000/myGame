package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.lessonsDone
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.feature.town.status.TOWN_DOCK
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

abstract class DockFrameFixture {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    protected val sessions: FakeSessionRepository = FakeSessionRepository()

    protected val towns: FakeTownRepository = FakeTownRepository()

    protected val reports: FakeReportRepository = FakeReportRepository()

    protected val placements: FakePlacementRepository = FakePlacementRepository()

    protected val holdoutChecks: FakeHoldoutCheckRepository = FakeHoldoutCheckRepository()

    protected val learning: FakeLearningRepository = FakeLearningRepository()

    protected var shownStack: NavBackStack<NavKey>? = null
        private set

    private val dependencies: AppDependencies = dependenciesOf(
        sessions = sessions,
        towns = towns,
        learning = learning,
        reports = reports,
        placements = placements,
        holdoutChecks = holdoutChecks,
    )

    protected val readAt: Instant = Clock.System.now()

    protected val firstLesson: LessonId = LessonId("lesson-1")

    protected val noCards: DueReviews =
        DueReviews(due = emptyList(), readFirst = emptyList(), nextDueAt = null, readAt = readAt)

    protected val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)

    protected val releasedLesson: NextStep.ReleasedLesson =
        NextStep.ReleasedLesson(LessonId("released-2-1"), PlacementBand.Second, position = 1)

    protected fun lessonOf(id: LessonId): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "A day in town",
        duration = 5.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        enteringWordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )

    protected fun playedTown(nextStep: NextStep = lessonsDone): TownSnapshot =
        townOf(readAt, nextStep = nextStep, lessons = listOf(lessonOf(firstLesson)))

    protected fun showing(
        vararg destinations: NavKey,
        town: TownSnapshot = playedTown(),
        townReads: Int = READS_AVAILABLE,
    ) {
        repeat(SESSION_READS) { sessions.answerRestore(verifiedSession) }
        repeat(townReads) { towns.answerRead(TownReadResult.Read(town)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations).also { shown: NavBackStack<NavKey> ->
                        shownStack = shown
                    },
                )
            }
        }
    }

    protected fun waitFor(matcher: SemanticsMatcher) {
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty() }
    }

    protected fun inTheDock(label: String): SemanticsMatcher =
        hasText(label).and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun goInTheDock(label: String): SemanticsMatcher =
        hasTestTag(INK_PILL).and(hasContentDescription(label, substring = true).or(hasText(label)))
            .and(hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    protected fun dockGo(label: String): SemanticsNodeInteraction {
        waitFor(goInTheDock(label))
        return composeRule.onNode(goInTheDock(label))
    }

    protected val reportRow: SemanticsMatcher =
        hasText(REPORT_ROW).and(hasClickAction()).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    protected val foldedRefusal: SemanticsMatcher =
        hasText(STUDY_SLOT_BUSY).and(hasAnyAncestor(hasScrollAction())).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    protected companion object {
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
        const val REPORT_GO: String = "Ir al informe"
        const val WAITING: String = "Esperando"
        const val STUDY_RELEASED: String = "Estudiar las palabras que vuelven"
        const val TOWN_HEADER: String = "Riverton · Pueblo"
        const val REPORT_ROW: String = "Informe"
        const val READS_AVAILABLE: Int = 5
        const val STATUS_AND_RING_READS: Int = 2
        const val WAIT_MILLIS: Long = 5_000

        private val verifiedSession: RestoreResult = RestoreResult.SignedIn(
            SignedInPlayer("player@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
        )
        private const val SESSION_READS: Int = 2
    }
}
