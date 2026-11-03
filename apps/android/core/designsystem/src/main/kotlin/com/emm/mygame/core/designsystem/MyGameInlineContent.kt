package com.emm.mygame.core.designsystem

import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.runtime.Immutable

@Immutable
class MyGameInlineContent(val byId: Map<String, InlineTextContent>)

internal val noInlineContent: MyGameInlineContent = MyGameInlineContent(emptyMap())
