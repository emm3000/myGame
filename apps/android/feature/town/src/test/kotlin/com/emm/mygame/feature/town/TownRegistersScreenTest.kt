package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameRegistering
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes

private val farmAtTwo: TownSnapshot = townOf(
    places = placesOf(placeAt(TownBuildingKind.Farm, level = 2)),
)

private val farmAtThree: TownSnapshot = farmAtTwo.copy(
    buildings = placesOf(placeAt(TownBuildingKind.Farm, level = 3)),
    readAt = readInstant + 1.minutes,
)

private val factoryUnbuilt: TownSnapshot = townOf(
    places = placesOf(placeAt(TownBuildingKind.Factory, level = 0)),
)

private val factoryBuilt: TownSnapshot = factoryUnbuilt.copy(
    buildings = placesOf(placeAt(TownBuildingKind.Factory, level = 1)),
    readAt = readInstant + 1.minutes,
)

@RunWith(RobolectricTestRunner::class)
class TownRegistersScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `pops the new window when a level finishes`() {
        showInFlight(farmAtTwo, farmAtThree, TownBuildingKind.Farm)

        assertInFlight(MyGameRegisteredRow.Window)
    }

    @Test
    fun `gives a place its hue when first built`() {
        showInFlight(factoryUnbuilt, factoryBuilt, TownBuildingKind.Factory)

        assertInFlight(MyGameRegisteredRow.Hue)
    }

    @Test
    fun `plays nothing when two reads agree`() {
        showInFlight(farmAtThree, farmAtThree.copy(readAt = readInstant + 2.minutes), TownBuildingKind.Farm)

        assertEquals(0, registeringNodes().size)
    }

    @Test
    fun `speaks each row once`() {
        showInFlight(farmAtTwo, farmAtThree, TownBuildingKind.Farm)

        assertEquals(listOf(listOf("Granja", "Nivel 3")), spokenTexts())
    }

    @Test
    fun `keeps every place silent when two reads agree`() {
        showInFlight(farmAtThree, farmAtThree.copy(readAt = readInstant + 2.minutes), TownBuildingKind.Farm)

        assertEquals(emptyList<List<String>>(), spokenTexts())
    }

    private fun showInFlight(previous: TownSnapshot, next: TownSnapshot, place: TownBuildingKind) {
        composeRule.mainClock.autoAdvance = false
        showBetween(composeRule, previous, next, place)
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun assertInFlight(row: MyGameRegisteredRow) {
        val registering: List<MyGameRegistering> = registeringNodes()
        assertEquals(listOf(row), registering.map { playing -> playing.row })
        assertTrue(registering.all { playing -> playing.fraction < 1f })
    }

    private fun registeringNodes(): List<MyGameRegistering> = registeringNodesOf(composeRule)

    private fun spokenTexts(): List<List<String>> =
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion) and hasPlaceName())
            .fetchSemanticsNodes()
            .map { node -> node.config[SemanticsProperties.Text].map { text -> text.text } }

    private fun hasPlaceName(): SemanticsMatcher = hasText("Granja") or hasText("Fábrica")
}
