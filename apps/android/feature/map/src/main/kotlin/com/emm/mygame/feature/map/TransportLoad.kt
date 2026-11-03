package com.emm.mygame.feature.map

import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount

internal data class TransportLoad(val party: List<UnitCount>, val cargo: List<ResourceQuantity>)
