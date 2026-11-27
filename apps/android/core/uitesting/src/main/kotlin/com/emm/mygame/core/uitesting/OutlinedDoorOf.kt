package com.emm.mygame.core.uitesting

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import com.emm.mygame.core.designsystem.control.OUTLINED_PILL
import com.emm.mygame.core.designsystem.control.PILL_CHEVRON

fun outlinedDoorOf(label: String): SemanticsMatcher =
    hasClickAction() and hasTestTag(OUTLINED_PILL) and hasAnyDescendant(hasText(label)) and
        hasAnyDescendant(hasTestTag(PILL_CHEVRON))
