package com.emm.mygame

import com.emm.mygame.navigation.Navigator

internal class SignedInChrome(
    val dependencies: AppDependencies,
    val navigator: Navigator,
    val onTaskAnswered: () -> Unit,
)
