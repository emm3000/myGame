package com.emm.mygame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.feature.fief.FiefRoute
import com.emm.mygame.feature.signin.SignInRoute

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val application: MyGameApplication = application as MyGameApplication
        setContent {
            MyGameTheme {
                var isSignedIn: Boolean by rememberSaveable { mutableStateOf(false) }
                if (isSignedIn) {
                    FiefRoute(
                        fiefs = application.fiefs,
                        sessions = application.sessions,
                        clock = application.clock,
                        onSignedOut = {
                            viewModelStore.clear()
                            isSignedIn = false
                        },
                    )
                } else {
                    SignInRoute(sessions = application.sessions, onSignedIn = { isSignedIn = true })
                }
            }
        }
    }
}
