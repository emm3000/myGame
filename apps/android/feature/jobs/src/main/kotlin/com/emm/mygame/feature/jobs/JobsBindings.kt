package com.emm.mygame.feature.jobs

import org.koin.core.module.Module
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.module

val jobsBindings: Module
    get() = module {
        viewModelOf(::MapViewModel)
    }
