package com.emm.mygame.feature.school

import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.days
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class SchoolSeasonMarkViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    @Test
    fun `marks the lessons in winter`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(seasonInForce = seasonOf(SeasonKind.Winter, study = 75), seasonEndsAt = readInstant + 3.days),
        )

        assertEquals(SchoolUiState.DurationMark(SeasonKind.Winter, percent = 75), contentOf(viewModel).studyMark)
    }

    @Test
    fun `marks the lessons a season lengthens with the percent as sent`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(seasonInForce = seasonOf(SeasonKind.Summer, study = 125), seasonEndsAt = readInstant + 3.days),
        )

        assertEquals(SchoolUiState.DurationMark(SeasonKind.Summer, percent = 125), contentOf(viewModel).studyMark)
    }

    @Test
    fun `marks nothing at 100`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(seasonInForce = seasonOf(SeasonKind.Winter, study = 100), seasonEndsAt = readInstant + 3.days),
        )

        assertNull(contentOf(viewModel).studyMark)
    }

    @Test
    fun `marks nothing before the epoch`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(seasonInForce = null, seasonEndsAt = null))

        assertNull(contentOf(viewModel).studyMark)
    }
}
