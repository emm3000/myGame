package com.emm.mygame.feature.school

import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport

internal val aguaOnTap: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "agua", language = WordSupport.Language.Spanish)

internal val waterDefinitionOnTap: WordSupport = WordSupport(
    shown = WordSupport.Shown.OnTap,
    text = "clear liquid that people drink",
    language = WordSupport.Language.English,
)

internal val beberOnTap: WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = "beber", language = WordSupport.Language.Spanish)

internal fun drinkWaterWord(ownSupport: WordSupport?): TownSnapshot.WordReading = TownSnapshot.WordReading(
    word = "water",
    frame = listOf(
        FrameSpan(text = "I ", support = null),
        FrameSpan(text = "drink", support = beberOnTap),
        FrameSpan(text = " water.", support = null),
    ),
    support = ownSupport,
)
