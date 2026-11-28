package com.emm.mygame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.koin.compose.KoinIsolatedContext

class RebuildHostActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val content: Shown = checkNotNull(shown)
        setContent {
            val backStack: NavBackStack<NavKey> = rememberNavBackStack(*content.destinations.toTypedArray())
            MyGameTheme {
                KoinIsolatedContext(context = content.app.graph) {
                    AppNavigation(
                        dependencies = content.app,
                        reminderTaps = emptyFlow(),
                        mailedLinks = emptyFlow(),
                        backStack = backStack,
                    )
                }
            }
        }
    }

    data class Shown(val app: FakeAppGraph, val destinations: List<NavKey>)

    companion object {
        var shown: Shown? = null
    }
}
