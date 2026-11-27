package com.emm.mygame

internal sealed interface TownFollowIntent {

    data class ScreenShown(val isLessonFinishFollowed: Boolean, val isTownReadOnOpen: Boolean) : TownFollowIntent

    data object ScreenHidden : TownFollowIntent

    data object TaskAnswered : TownFollowIntent
}
