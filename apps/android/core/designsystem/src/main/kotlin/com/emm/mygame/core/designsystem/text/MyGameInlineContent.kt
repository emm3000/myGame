package com.emm.mygame.core.designsystem.text

import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.runtime.Immutable

@Immutable
class MyGameInlineContent(val byId: Map<String, InlineTextContent>)

internal val noInlineContent: MyGameInlineContent = MyGameInlineContent(emptyMap())
