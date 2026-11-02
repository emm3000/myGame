package com.emm.mygame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.feature.signin.SignInRoute

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val sessions: SessionRepository = (application as MyGameApplication).sessions
        setContent {
            MyGameTheme {
                SignInRoute(sessions = sessions)
            }
        }
    }
}
