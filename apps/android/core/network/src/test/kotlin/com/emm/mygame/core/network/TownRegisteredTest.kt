package com.emm.mygame.core.network

import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TownRegisteredTest {

    private val firstReadAt: Instant = Instant.parse("2026-11-07T10:00:00Z")

    private val runningLesson: LessonId = LessonId("lesson-1")

    @Test
    fun `registers nothing when two reads agree`() {
        val town: TownSnapshot = townOf(homesLevel = 2, retained = RetainedWords(count = 1, total = 5))

        assertEquals(TownRegistered.nothing, registeredBetween(town, town.copy(readAt = firstReadAt + 1.minutes)))
    }

    @Test
    fun `registers each place whose level rose with the level it held`() {
        val before: TownSnapshot = townOf(homesLevel = 2, farmLevel = 0)
        val after: TownSnapshot = townOf(homesLevel = 3, farmLevel = 1)

        assertEquals(
            listOf(
                TownRegistered.RaisedPlace(TownBuildingKind.Homes, levelBefore = 2),
                TownRegistered.RaisedPlace(TownBuildingKind.Farm, levelBefore = 0),
            ),
            registeredBetween(before, after).raisedPlaces,
        )
    }

    @Test
    fun `registers no place whose level held`() {
        val before: TownSnapshot = townOf(homesLevel = 2, farmLevel = 1)
        val after: TownSnapshot = townOf(homesLevel = 2, farmLevel = 2)

        assertEquals(
            listOf(TownRegistered.RaisedPlace(TownBuildingKind.Farm, levelBefore = 1)),
            registeredBetween(before, after).raisedPlaces,
        )
    }

    @Test
    fun `registers the ring's rise with the count it held`() {
        val before: TownSnapshot = townOf(retained = RetainedWords(count = 1, total = 5))
        val after: TownSnapshot = townOf(retained = RetainedWords(count = 2, total = 5))

        assertEquals(TownRegistered.RingRise(countBefore = 1), registeredBetween(before, after).ringRise)
    }

    @Test
    fun `registers no ring when a retained word falls back`() {
        val before: TownSnapshot = townOf(retained = RetainedWords(count = 2, total = 5))
        val after: TownSnapshot = townOf(retained = RetainedWords(count = 1, total = 5))

        assertNull(registeredBetween(before, after).ringRise)
    }

    @Test
    fun `registers no ring when the ring counts another lesson`() {
        val before: TownSnapshot = townOf(retained = RetainedWords(count = 4, total = 5))
        val after: TownSnapshot = townOf(retained = RetainedWords(count = 5, total = 6))

        assertNull(registeredBetween(before, after).ringRise)
    }

    @Test
    fun `registers no ring while the earlier read holds none`() {
        val before: TownSnapshot = townOf(retained = null)
        val after: TownSnapshot = townOf(retained = RetainedWords(count = 1, total = 5))

        assertNull(registeredBetween(before, after).ringRise)
    }

    @Test
    fun `registers no ring while the later read holds none`() {
        val before: TownSnapshot = townOf(retained = RetainedWords(count = 1, total = 5))
        val after: TownSnapshot = townOf(retained = null)

        assertNull(registeredBetween(before, after).ringRise)
    }

    @Test
    fun `registers the running lesson the later read holds studied`() {
        val before: TownSnapshot = townOf(slot = runningLesson, studied = emptySet())
        val after: TownSnapshot = townOf(slot = null, studied = setOf(runningLesson))

        assertEquals(runningLesson, registeredBetween(before, after).finishedLesson)
    }

    @Test
    fun `registers no lesson the later read holds unstudied`() {
        val before: TownSnapshot = townOf(slot = runningLesson, studied = emptySet())
        val after: TownSnapshot = townOf(slot = runningLesson, studied = emptySet())

        assertNull(registeredBetween(before, after).finishedLesson)
    }

    @Test
    fun `registers no lesson while the earlier read runs none`() {
        val before: TownSnapshot = townOf(slot = null, studied = setOf(runningLesson))
        val after: TownSnapshot = townOf(slot = null, studied = setOf(runningLesson))

        assertNull(registeredBetween(before, after).finishedLesson)
    }

    private fun townOf(
        homesLevel: Int = 1,
        farmLevel: Int = 1,
        retained: RetainedWords? = null,
        slot: LessonId? = null,
        studied: Set<LessonId> = emptySet(),
    ): TownSnapshot = TownSnapshot(
        name = "Maple",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 4, free = 4, atWork = 0),
        buildings = listOf(
            TownSnapshot.Building(TownBuildingKind.Homes, level = homesLevel, next = null),
            TownSnapshot.Building(TownBuildingKind.Farm, level = farmLevel, next = null),
        ),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = listOf(lessonOf(runningLesson, isStudied = runningLesson in studied)),
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = retained),
        lessonSlot = slot?.let { lesson: LessonId ->
            TownSnapshot.LessonSlot(lesson, startedAt = firstReadAt, finishesAt = firstReadAt + 5.minutes)
        },
        hiring = hiringOf(),
        job = null,
        nextStep = NextStep.CaughtUp,
        nextDueAt = null,
        readAt = firstReadAt,
    )

    private fun lessonOf(id: LessonId, isStudied: Boolean): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = id,
        theme = "Home",
        duration = 5.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = isStudied,
        wordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )
}
