package com.emm.mygame.feature.shell

sealed interface FrameKind {

    data object Home : FrameKind

    data object Place : FrameKind

    data object Door : FrameKind

    data object Task : FrameKind
}
