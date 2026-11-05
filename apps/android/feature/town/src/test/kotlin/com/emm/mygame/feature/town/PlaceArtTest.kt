package com.emm.mygame.feature.town

import com.emm.mygame.core.designsystem.R as DesignSystemR
import com.emm.mygame.core.network.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PlaceArtTest {

    @Test
    fun `gives a place at level 0 no image`() {
        assertNull(placeArtOf(TownBuildingKind.Factory, level = 0))
    }

    @Test
    fun `gives two levels one image`() {
        assertEquals(
            listOf(
                DesignSystemR.drawable.designsystem_place_farm_2,
                DesignSystemR.drawable.designsystem_place_farm_2,
            ),
            listOf(placeArtOf(TownBuildingKind.Farm, level = 3), placeArtOf(TownBuildingKind.Farm, level = 4)),
        )
    }

    @Test
    fun `gives the top level the last image`() {
        assertEquals(
            DesignSystemR.drawable.designsystem_place_power_station_5,
            placeArtOf(TownBuildingKind.PowerStation, level = 10),
        )
    }
}
