package com.emm.mygame.feature.town

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameRegistering
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.REGISTERING
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.registeredBetween
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private val farmAtTwo: TownSnapshot = townOf(places = placesOf(placeAt(TownBuildingKind.Farm, level = 2)))

private val farmAtThree: TownSnapshot =
    townOf(places = placesOf(placeAt(TownBuildingKind.Farm, level = 3)), readAt = readInstant + 1.minutes)

private val factoryUnbuilt: TownSnapshot = townOf(places = placesOf(placeAt(TownBuildingKind.Factory, level = 0)))

private val factoryBuilt: TownSnapshot =
    townOf(places = placesOf(placeAt(TownBuildingKind.Factory, level = 1)), readAt = readInstant + 1.minutes)

@RunWith(RobolectricTestRunner::class)
class TownRegistersScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `pops the new window when a level finishes`() {
        showInFlight(farmAtTwo, farmAtThree)

        assertInFlight(MyGameRegisteredRow.Window)
    }

    @Test
    fun `gives a place its hue when first built`() {
        showInFlight(factoryUnbuilt, factoryBuilt)

        assertInFlight(MyGameRegisteredRow.Hue)
    }

    @Test
    fun `plays nothing when two reads agree`() {
        showInFlight(farmAtThree, farmAtThree.copy(readAt = readInstant + 2.minutes))

        assertEquals(0, registeringNodes().size)
    }

    @Test
    fun `speaks each row once`() {
        showInFlight(farmAtTwo, farmAtThree)

        assertEquals(listOf(listOf("Granja", "Nivel 3")), spokenTexts())
    }

    @Test
    fun `keeps every place silent when two reads agree`() {
        showInFlight(farmAtThree, farmAtThree.copy(readAt = readInstant + 2.minutes))

        assertEquals(emptyList<List<String>>(), spokenTexts())
    }

    private fun showInFlight(previous: TownSnapshot, next: TownSnapshot) {
        composeRule.mainClock.autoAdvance = false
        showBetween(composeRule, previous, next)
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun assertInFlight(row: MyGameRegisteredRow) {
        val registering: List<MyGameRegistering> = registeringNodes()
        assertEquals(listOf(row, row), registering.map { playing -> playing.row })
        assertTrue(registering.all { playing -> playing.fraction < 1f })
    }

    private fun registeringNodes(): List<MyGameRegistering> = registeringNodesOf(composeRule)

    private fun spokenTexts(): List<List<String>> =
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion) and hasPlaceName())
            .fetchSemanticsNodes()
            .map { node -> node.config[SemanticsProperties.Text].map { text -> text.text } }

    private fun hasPlaceName(): SemanticsMatcher = hasText("Granja") or hasText("Fábrica")
}

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

private fun showBetween(composeRule: ComposeContentTestRule, previous: TownSnapshot, next: TownSnapshot) {
    val registered: TownRegistered = registeredBetween(previous, next)
    composeRule.setContent {
        MyGameTheme {
            TownScreen(
                state = next.contentAt(readInstant, Duration.ZERO, TownMutations.none, registered),
                onIntent = { },
                onSchoolOpen = { },
                onReportOpen = { },
                onReviewsOpen = { },
                onLessonOpen = { },
            )
        }
    }
}

private fun registeringNodesOf(composeRule: ComposeContentTestRule): List<MyGameRegistering> =
    composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
        .fetchSemanticsNodes()
        .map { node -> node.config[REGISTERING] }
