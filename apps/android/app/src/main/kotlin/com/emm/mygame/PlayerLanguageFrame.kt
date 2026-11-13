package com.emm.mygame

import android.content.Context
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
import com.emm.mygame.core.ui.inScaffoldLanguage

@Composable
internal fun InPlayerLanguage(language: PlayerLanguage?, content: @Composable () -> Unit) {
    val phoneContext: Context = LocalContext.current
    val phoneConfiguration: Configuration = LocalConfiguration.current
    val phoneResources: Resources = LocalResources.current
    val copyLanguage: CopyLanguage? = language?.toCopyLanguage()
    val scaffold: ScaffoldLanguage? = copyLanguage?.scaffold
    val scaffoldContext: Context? = remember(phoneContext, phoneConfiguration, scaffold) {
        scaffold?.let { phoneContext.inScaffoldLanguage(it) }
    }
    CompositionLocalProvider(
        LocalContext provides (scaffoldContext ?: phoneContext),
        LocalConfiguration provides (scaffoldContext?.resources?.configuration ?: phoneConfiguration),
        LocalResources provides (scaffoldContext?.resources ?: phoneResources),
    ) {
        ProvideCopyLanguage(language = copyLanguage, content = content)
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
