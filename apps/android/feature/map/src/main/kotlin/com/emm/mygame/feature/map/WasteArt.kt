package com.emm.mygame.feature.map

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.designsystem.R as DesignSystemR

internal fun wasteArtOf(size: WasteSize): MyGameArt = MyGameArt(
    drawable = when (size) {
        WasteSize.Small -> DesignSystemR.drawable.designsystem_waste_1
        WasteSize.Medium -> DesignSystemR.drawable.designsystem_waste_2
        WasteSize.Large -> DesignSystemR.drawable.designsystem_waste_3
    },
    tint = MyGameArtTint.InkMuted,
)
