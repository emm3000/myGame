package com.emm.mygame.feature.jobs

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.R as DesignSystemR
import com.emm.mygame.core.model.town.jobs.WasteSize

internal fun wasteArtOf(size: WasteSize): MyGameArt = MyGameArt(
    drawable = when (size) {
        WasteSize.Small -> DesignSystemR.drawable.designsystem_waste_1
        WasteSize.Medium -> DesignSystemR.drawable.designsystem_waste_2
        WasteSize.Large -> DesignSystemR.drawable.designsystem_waste_3
    },
    tint = MyGameArtTint.InkMuted,
)
