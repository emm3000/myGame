package com.emm.mygame.navigation

import com.emm.mygame.Destination
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand

abstract class NavigatorFixture {

    protected val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    protected val sessionEndedSignIn: Destination.SignIn = Destination.SignIn(isSessionEnded = true)

    protected val firstLesson: LessonId = LessonId("lesson-1")

    protected val secondLesson: LessonId = LessonId("lesson-2")

    protected val firstWords: Destination.LessonWords = Destination.LessonWords(firstLesson, walked = emptyList())

    protected val secondWords: Destination.LessonWords =
        Destination.LessonWords(secondLesson, walked = listOf(firstLesson))

    protected val firstBandEighthWeek: Destination.HoldoutCheck =
        Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)
}
