package com.emm.mygame.feature.placement

import org.koin.core.module.Module
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.module

val placementBindings: Module
    get() = module {
        viewModelOf(::PlacementViewModel)
        viewModelOf(::PlacementOfferViewModel)
    }
