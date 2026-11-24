package com.emm.mygame.feature.town

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
class TownRegistersAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `lands a raised place's window at once at animator scale 0`() {
        showRaised(TownBuildingKind.Farm, from = 2, to = 3)

        assertEquals(listOf(MyGameRegisteredRow.Window to 1f), landedRows())
    }

    @Test
    fun `lands a first-built place's hue at once at animator scale 0`() {
        showRaised(TownBuildingKind.Factory, from = 0, to = 1)

        assertEquals(listOf(MyGameRegisteredRow.Hue to 1f), landedRows())
    }

    private fun showRaised(place: TownBuildingKind, from: Int, to: Int) {
        composeRule.mainClock.autoAdvance = false
        val before: TownSnapshot = townOf(places = placesOf(placeAt(place, level = from)), nextStep = openingOn(place))
        val after: TownSnapshot =
            before.copy(buildings = placesOf(placeAt(place, level = to)), readAt = readInstant + 1.minutes)
        showBetween(composeRule, before, after)
    }

    private fun landedRows(): List<Pair<MyGameRegisteredRow, Float>> =
        registeringNodesOf(composeRule).map { registering -> registering.row to registering.fraction }

    private companion object {
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
