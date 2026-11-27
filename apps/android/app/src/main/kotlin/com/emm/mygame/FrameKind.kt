package com.emm.mygame

internal sealed interface FrameKind {

    data object Home : FrameKind

    data object Place : FrameKind

    data object Door : FrameKind

    data object Task : FrameKind
}
