package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand

internal val firstBandEighthWeekDue: HoldoutCheck.Due = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)

internal val firstBandEighthWeekAsking: HoldoutCheck.Asking =
    HoldoutCheck.Asking(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(house, walk))

internal val secondBandTwentyFourthWeekDue: HoldoutCheck.Due =
    HoldoutCheck.Due(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)
