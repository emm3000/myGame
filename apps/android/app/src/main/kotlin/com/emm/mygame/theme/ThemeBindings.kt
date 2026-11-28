package com.emm.mygame.theme

import android.content.Context
import com.emm.mygame.core.model.theme.ThemeSettings
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.bind
import org.koin.dsl.module

val themeBindings: Module
    get() = module {
        single {
            ThemeStore(preferences = androidContext().getSharedPreferences(THEME_FILE_NAME, Context.MODE_PRIVATE))
        } bind ThemeSettings::class
    }

private const val THEME_FILE_NAME: String = "theme"
