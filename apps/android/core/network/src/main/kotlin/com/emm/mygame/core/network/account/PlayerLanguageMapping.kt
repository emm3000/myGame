package com.emm.mygame.core.network.account

import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.network.generated.models.ChromePhase
import com.emm.mygame.core.network.generated.models.Scaffold

internal fun Scaffold.toPlayerScaffold(): PlayerScaffold? = when (this) {
    Scaffold.es -> PlayerScaffold.Spanish
    Scaffold.none -> PlayerScaffold.None
    Scaffold.unknown_default_open_api -> null
}

internal fun ChromePhase.toPlayerChromePhase(): PlayerChromePhase? = when (this) {
    ChromePhase.scaffold -> PlayerChromePhase.Scaffold
    ChromePhase.both -> PlayerChromePhase.Both
    ChromePhase.english -> PlayerChromePhase.English
    ChromePhase.unknown_default_open_api -> null
}

internal fun PlayerScaffold.toScaffold(): Scaffold = when (this) {
    PlayerScaffold.Spanish -> Scaffold.es
    PlayerScaffold.None -> Scaffold.none
}
