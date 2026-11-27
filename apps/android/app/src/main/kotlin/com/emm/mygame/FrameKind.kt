package com.emm.mygame

internal sealed interface FrameKind {

    data object Home : FrameKind

    data class Place(val doesScreenReadTown: Boolean) : FrameKind

    data object Task : FrameKind
}
