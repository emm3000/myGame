package com.emm.mygame

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.emm.mygame.core.designsystem.MyGameTheme
import java.util.Locale

class MainActivity : ComponentActivity() {

    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(newBase.inScaffoldLanguage())
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val application: MyGameApplication = application as MyGameApplication
        setContent {
            MyGameTheme {
                AppNavigation(dependencies = application)
            }
        }
    }
}

private val scaffoldLanguage: Locale = Locale.forLanguageTag("es")

private fun Context.inScaffoldLanguage(): Context {
    val configuration: Configuration = Configuration(resources.configuration)
    configuration.setLocale(scaffoldLanguage)
    return createConfigurationContext(configuration)
}
