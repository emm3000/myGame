package com.emm.mygame.feature.report

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import com.emm.mygame.core.designsystem.NAV_ROW_CHEVRON

internal fun navRowOf(title: String): SemanticsMatcher =
    hasClickAction() and hasAnyDescendant(hasText(title)) and hasAnyDescendant(hasTestTag(NAV_ROW_CHEVRON))
