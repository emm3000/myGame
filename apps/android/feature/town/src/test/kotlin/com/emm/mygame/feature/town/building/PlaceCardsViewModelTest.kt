package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.TownViewModel
import com.emm.mygame.feature.town.TownViewModelFixtures
import com.emm.mygame.feature.town.contentOf
import com.emm.mygame.feature.town.nextLevelOf
import com.emm.mygame.feature.town.placeOf
import com.emm.mygame.feature.town.placesOf
import com.emm.mygame.feature.town.townOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class PlaceCardsViewModelTest : TownViewModelFixtures() {

    @Test
    fun `draws a place's word need with the words held toward it`() = runTest {
        val need: TownSnapshot.WordsNeeded = TownSnapshot.WordsNeeded(10, NeededWordKind.Stable, held = 4)
        val farm: TownSnapshot.Building =
            TownSnapshot.Building(TownBuildingKind.Farm, level = 2, next = nextLevelOf(level = 3, wordsNeeded = need))
        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(farm)))

        assertEquals(
            WordNeedLine(needed = 10, held = 4, standing = NeededWordKind.Stable),
            placeOf(viewModel, TownBuildingKind.Farm).next?.wordsNeeded,
        )
    }

    @Test
    fun `blocks no level on the words it needs`() = runTest {
        val need: TownSnapshot.WordsNeeded = TownSnapshot.WordsNeeded(10, NeededWordKind.Stable, held = 0)
        val farm: TownSnapshot.Building =
            TownSnapshot.Building(TownBuildingKind.Farm, level = 2, next = nextLevelOf(level = 3, wordsNeeded = need))
        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf(farm)))

        assertEquals(null, placeOf(viewModel, TownBuildingKind.Farm).block)
    }

    @Test
    fun `draws the seven places in the street's order`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(places = placesOf().reversed()))

        assertEquals(
            listOf(
                TownBuildingKind.Homes,
                TownBuildingKind.Farm,
                TownBuildingKind.School,
                TownBuildingKind.Office,
                TownBuildingKind.Factory,
                TownBuildingKind.PowerStation,
                TownBuildingKind.Storage,
            ),
            contentOf(viewModel).places.map { place: PlaceCard -> place.kind },
        )
    }
}
