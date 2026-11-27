package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.navigation.NAVIGATION_BAR
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TodayNavigationTest : AppNavigationFixture() {

    @Test
    fun `a town with no name shows the naming alone with no bar`() {
        signedInReading(TownReadResult.NoTown)

        waitForLine(NAMING_TITLE)

        composeRule.onAllNodes(hasTestTag(NAVIGATION_BAR)).assertCountEquals(0)
    }

    @Test
    fun `Read the words on the running lesson's first card opens its words`() {
        signedInReading(TownReadResult.Read(runningTown()))
        repeat(2) { learning.answerRead(noReviews) }

        wayOn(READ_THE_WORDS).performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `the job's row in In progress opens the region map, and back returns to Today`() {
        signedInReading(TownReadResult.Read(playedTown().copy(job = jobOnTheWay())))

        link(JOB_ON_THE_WAY).performClick()
        waitForLine(MAP_TITLE)
        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }

        waitForLine(JOB_ON_THE_WAY)
        composeRule.onAllNodes(hasText(MAP_TITLE)).assertCountEquals(0)
    }

    @Test
    fun `a task screen draws no bar`() {
        signedInReading(TownReadResult.Read(runningTown()))
        repeat(2) { learning.answerRead(noReviews) }
        wayOn(READ_THE_WORDS).performClick()
        waitForLine("I drink water.")

        composeRule.onAllNodes(hasTestTag(NAVIGATION_BAR)).assertCountEquals(0)
    }

    @Test
    fun `Learn carries the count the reviews hold`() {
        signedInReading(TownReadResult.Read(reviewsDueTown))

        waitedFor(hasContentDescription("Aprender, 3").and(hasAnyAncestor(hasTestTag(NAVIGATION_BAR))))
    }

    private fun jobOnTheWay(): TownSnapshot.Job = TownSnapshot.Job(
        site = TownSite(region = 1, area = 1, site = 3),
        team = mapOf(TownHireKind.Worker to 3, TownHireKind.Truck to 1),
        task = TownSnapshot.JobTask.Hours(hours = 2),
        pay = TownResourceKind.entries.associateWith { 0L },
        phase = TownSnapshot.JobPhase.Outbound,
        sentAt = readAt,
        arrivesAt = readAt + 10.minutes,
        leavesAt = readAt + 2.hours,
        returnsAt = readAt + 3.hours,
        calledBackAt = null,
    )

    private companion object {
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
        const val JOB_ON_THE_WAY: String = "Tu equipo va en camino, llega en"
        const val MAP_TITLE: String = "Mapa"
        const val READ_THE_WORDS: String = "Leer las palabras"
    }
}
