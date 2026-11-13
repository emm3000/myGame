package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FrameSpan

internal fun List<FrameSpan>.joinedText(): String = joinToString(separator = "") { span: FrameSpan -> span.text }
