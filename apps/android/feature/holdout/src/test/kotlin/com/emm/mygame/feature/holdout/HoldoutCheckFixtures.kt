package com.emm.mygame.feature.holdout

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand

internal val firstBandEighthWeekDue: HoldoutCheck.Due = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)

internal val firstBandEighthWeekAsking: HoldoutCheck.Asking =
    HoldoutCheck.Asking(PlacementBand.First, HoldoutCheckWeek.Eighth, listOf(house, walk))

internal val secondBandTwentyFourthWeekDue: HoldoutCheck.Due =
    HoldoutCheck.Due(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)
