package com.emm.mygame.feature.report

import com.emm.mygame.feature.report.news.NewsViewModel
import org.koin.core.module.Module
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.module

val reportBindings: Module
    get() = module {
        viewModelOf(::NewsViewModel)
    }
