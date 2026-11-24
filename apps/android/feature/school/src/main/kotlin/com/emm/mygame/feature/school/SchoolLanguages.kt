package com.emm.mygame.feature.school

import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage

internal class SchoolLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}
