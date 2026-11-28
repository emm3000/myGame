package com.emm.mygame.navigation

import com.emm.mygame.feature.report.reportBindings
import org.koin.core.module.Module
import org.koin.dsl.module

val screenBindings: Module
    get() = module {
        includes(reportBindings)
    }
