package com.emm.mygame

import android.content.Context
import android.content.ContextWrapper
import android.content.res.Configuration
import android.content.res.Resources
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalResources
import com.emm.mygame.core.network.PlayerChromePhase
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import java.util.Locale

@Composable
internal fun InPlayerLanguage(language: PlayerLanguage?, content: @Composable () -> Unit) {
    val phoneContext: Context = LocalContext.current
    val phoneConfiguration: Configuration = LocalConfiguration.current
    val phoneResources: Resources = LocalResources.current
    val scaffold: PlayerScaffold? = language?.scaffold
    val scaffoldContext: Context? = remember(phoneContext, phoneConfiguration, scaffold) {
        scaffold?.let { phoneContext.inLocale(scaffoldLocaleOf(it)) }
    }
    CompositionLocalProvider(
        LocalContext provides (scaffoldContext ?: phoneContext),
        LocalConfiguration provides (scaffoldContext?.resources?.configuration ?: phoneConfiguration),
        LocalResources provides (scaffoldContext?.resources ?: phoneResources),
    ) {
        ProvideCopyLanguage(language = language?.toCopyLanguage(), content = content)
    }
}

internal fun PlayerLanguage.toCopyLanguage(): CopyLanguage = CopyLanguage(
    scaffold = when (scaffold) {
        PlayerScaffold.Spanish -> ScaffoldLanguage.Spanish
        PlayerScaffold.None -> ScaffoldLanguage.None
    },
    chromePhase = when (chromePhase) {
        PlayerChromePhase.Scaffold -> ChromePhase.Scaffold
        PlayerChromePhase.Both -> ChromePhase.Both
        PlayerChromePhase.English -> ChromePhase.English
    },
)

private fun scaffoldLocaleOf(scaffold: PlayerScaffold): Locale = when (scaffold) {
    PlayerScaffold.Spanish -> Locale.forLanguageTag("es")
    PlayerScaffold.None -> Locale.forLanguageTag("en-US")
}

private fun Context.inLocale(locale: Locale): Context {
    val configuration: Configuration = Configuration(resources.configuration)
    configuration.setLocale(locale)
    val localized: Resources = createConfigurationContext(configuration).resources
    return object : ContextWrapper(this) {
        override fun getResources(): Resources = localized
    }
}
