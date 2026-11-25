package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.jobs.RegionMap

internal sealed interface AreaRead {

    data object Reading : AreaRead

    data class Read(val map: RegionMap) : AreaRead

    data object NotFound : AreaRead

    data object Failed : AreaRead
}
