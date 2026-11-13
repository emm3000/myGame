package com.emm.mygame.core.ui

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Resources

fun Context.inScaffoldLanguage(scaffold: ScaffoldLanguage): Context {
    val scaffoldResources: Resources = resourcesIn(scaffold.locale())
    return object : ContextWrapper(this) {
        override fun getResources(): Resources = scaffoldResources
    }
}
