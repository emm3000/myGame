package com.emm.mygame.core.ui

import android.content.Context
import android.content.res.Configuration
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import com.emm.mygame.core.designsystem.MyGameLabel
import java.util.Locale

class PlayerCopy(context: Context, private val language: CopyLanguage?) {

    private val english: CopyReader = context.copyReaderIn(americanEnglish)

    private val scaffold: CopyReader = when (language?.scaffold) {
        null -> context.phoneCopyReader()
        ScaffoldLanguage.Spanish -> context.copyReaderIn(spanish)
        ScaffoldLanguage.None -> english
    }

    fun chrome(line: CopyReader.() -> String): MyGameLabel = when (language?.chromePhase) {
        null, ChromePhase.Scaffold -> MyGameLabel(text = scaffold.line(), translation = null)
        ChromePhase.Both -> MyGameLabel(text = english.line(), translation = scaffold.line())
        ChromePhase.English -> MyGameLabel(text = english.line(), translation = null)
    }

    fun chrome(@StringRes id: Int, vararg arguments: Pair<String, Any>): MyGameLabel =
        chrome { text(id, *arguments) }

    fun fixedCopy(line: CopyReader.() -> String): String = scaffold.line()

    fun fixedCopy(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
        fixedCopy { text(id, *arguments) }
}

@Composable
fun rememberPlayerCopy(): PlayerCopy {
    val context: Context = LocalContext.current
    val language: CopyLanguage? = currentCopyLanguage
    val configuration: Configuration = LocalConfiguration.current
    return remember(context, configuration, language) { PlayerCopy(context, language) }
}

@Composable
fun chromeResource(@StringRes id: Int, vararg arguments: Pair<String, Any>): MyGameLabel =
    rememberPlayerCopy().chrome(id, *arguments)

@Composable
fun fixedCopyResource(@StringRes id: Int, vararg arguments: Pair<String, Any>): String =
    rememberPlayerCopy().fixedCopy(id, *arguments)

private val americanEnglish: Locale = Locale.forLanguageTag("en-US")

private val spanish: Locale = Locale.forLanguageTag("es")
