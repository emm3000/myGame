package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.network.generated.models.JobBackNewsParamsSite

internal fun JobBackNewsParamsSite.toTownSite(): TownSite = TownSite(region = region, area = area, site = site)
