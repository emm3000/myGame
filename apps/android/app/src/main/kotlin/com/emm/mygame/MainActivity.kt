package com.emm.mygame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.emm.mygame.core.designsystem.MyGameTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val application: MyGameApplication = application as MyGameApplication
        setContent {
            MyGameTheme {
                AppNavigation(application = application)
            }
        }
    }
}
