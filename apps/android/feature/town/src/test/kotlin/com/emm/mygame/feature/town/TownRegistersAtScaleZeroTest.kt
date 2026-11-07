package com.emm.mygame.feature.town

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownRegistersAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `lands each row at once at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        val raisedAndBuilt: TownSnapshot = townOf(
            places = placesOf(
                placeAt(TownBuildingKind.Farm, level = 3),
                placeAt(TownBuildingKind.Factory, level = 1),
            ),
            readAt = readInstant + 1.minutes,
        )
        val before: TownSnapshot = townOf(
            places = placesOf(
                placeAt(TownBuildingKind.Farm, level = 2),
                placeAt(TownBuildingKind.Factory, level = 0),
            ),
        )
        showBetween(composeRule, before, raisedAndBuilt)

        assertEquals(
            setOf(MyGameRegisteredRow.Window to 1f, MyGameRegisteredRow.Hue to 1f),
            registeringNodesOf(composeRule).map { registering -> registering.row to registering.fraction }.toSet(),
        )
    }

    private companion object {
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}
