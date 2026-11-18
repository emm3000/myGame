package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.projection.StudyReminderLine
import kotlinx.coroutines.flow.Flow

internal class Navigator(private val backStack: MutableList<NavKey>, private val links: NavigationLinks) {

    val areLinksEnabled: Boolean
        get() = links.areEnabled

    val shown: NavKey?
        get() = backStack.lastOrNull()

    fun signingOut() {
        links.areEnabled = false
    }

    fun back() {
        if (!areLinksEnabled) return
        if (backStack.size > 1) backStack.removeAt(backStack.lastIndex)
    }

    fun openSignUp() {
        if (backStack.lastOrNull() is Destination.SignIn) backStack.add(Destination.SignUp)
    }

    fun openForgotPassword() {
        if (backStack.lastOrNull() is Destination.SignIn) backStack.add(Destination.ForgotPassword)
    }

    fun openSignIn() {
        when (backStack.lastOrNull()) {
            Destination.SignUp, Destination.ForgotPassword -> back()
            else -> Unit
        }
    }

    fun signedIn() {
        val shownAboveTown: Destination? = links.reminderLineOnSignIn?.shownAboveTown()
        links.reminderLineOnSignIn = null
        backStack.showAlone(listOfNotNull(Destination.Town, shownAboveTown))
    }

    fun signedOut(isSessionEnded: Boolean) {
        links.areEnabled = true
        links.reminderLineOnSignIn = null
        backStack.showAlone(listOf(Destination.SignIn(isSessionEnded = isSessionEnded)))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
    }

    fun openSchool() {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Town -> backStack.add(Destination.School)
            is Destination.LessonWords -> {
                backStack.backToTown()
                backStack.add(Destination.School)
            }
            else -> Unit
        }
    }

    fun openLesson(lesson: LessonId, walked: List<LessonId>) {
        if (!areLinksEnabled) return
        val words: Destination.LessonWords = Destination.LessonWords(lesson, walked)
        when (backStack.lastOrNull()) {
            Destination.Town, Destination.Report, Destination.School -> backStack.add(words)
            is Destination.LessonWords, Destination.Review -> backStack[backStack.lastIndex] = words
            else -> Unit
        }
    }

    fun openReport() {
        backStack.openAboveTown(Destination.Report, links)
    }

    fun openNews() {
        if (!areLinksEnabled) return
        if (backStack.lastOrNull() == Destination.Report) backStack.add(Destination.News)
    }

    fun openSettings() {
        if (!areLinksEnabled) return
        if (backStack.lastOrNull() == Destination.Report) backStack.add(Destination.Settings)
    }

    fun openMap() {
        backStack.openAboveTown(Destination.Map, links)
    }

    fun openPlacement() {
        backStack.openAboveTown(Destination.Placement, links)
    }

    fun openHoldoutCheck(band: PlacementBand, week: HoldoutCheckWeek) {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Town, Destination.School -> backStack.add(Destination.HoldoutCheck(band, week))
            else -> Unit
        }
    }

    fun openReviews() {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Town, Destination.Report, Destination.School, is Destination.LessonWords ->
                backStack.add(Destination.Review)
            else -> Unit
        }
    }

    fun openReminder(line: StudyReminderLine) {
        if (Destination.Town !in backStack) {
            links.reminderLineOnSignIn = line
            return
        }
        if (!areLinksEnabled) return
        backStack.backToTown()
        line.shownAboveTown()?.let(backStack::add)
    }

    fun openTown() {
        if (backStack.lastOrNull().isAboveTown()) backStack.backToTown()
    }
}

private fun MutableList<NavKey>.openAboveTown(shownNext: Destination, links: NavigationLinks) {
    if (!links.areEnabled) return
    val shown: NavKey? = lastOrNull()
    if (shown != Destination.Town && !shown.isAboveTown()) return
    backToTown()
    add(shownNext)
}

private fun StudyReminderLine.shownAboveTown(): Destination? = when (this) {
    StudyReminderLine.Cards -> Destination.Report
    StudyReminderLine.Check, StudyReminderLine.Lesson -> null
}

private fun MutableList<NavKey>.backToTown() {
    subList(indexOf(Destination.Town) + 1, size).clear()
}

private fun MutableList<NavKey>.showAlone(destinations: List<Destination>) {
    if (this == destinations) return
    val replaced: Int = size
    addAll(destinations)
    repeat(replaced) { removeAt(0) }
}

private fun NavKey?.isAboveTown(): Boolean = when (this) {
    Destination.School,
    Destination.Report,
    Destination.News,
    Destination.Settings,
    Destination.Map,
    Destination.Review,
    Destination.Placement,
    is Destination.HoldoutCheck,
    is Destination.LessonWords,
    -> true
    else -> false
}
