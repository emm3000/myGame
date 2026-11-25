package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
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
        when (backStack.lastOrNull()) {
            is Destination.SignIn -> backStack.add(Destination.ForgotPassword)
            is Destination.ResetPassword ->
                backStack.showAlone(listOf(Destination.SignIn(isSessionEnded = false), Destination.ForgotPassword))
            else -> Unit
        }
    }

    fun openMailedLink(link: Destination.MailedLink) {
        backStack.showAlone(listOf(link))
    }

    fun openSignIn() {
        when (backStack.lastOrNull()) {
            Destination.SignUp, Destination.ForgotPassword -> back()
            is Destination.MailedLink -> backStack.showAlone(listOf(Destination.SignIn(isSessionEnded = false)))
            else -> Unit
        }
    }

    fun signedIn() {
        if (backStack.lastOrNull() is Destination.MailedLink) return
        val shownAboveToday: Destination? = links.reminderLineOnSignIn?.shownAboveToday()
        links.reminderLineOnSignIn = null
        backStack.showAlone(listOfNotNull(Destination.Today, shownAboveToday))
    }

    fun signedOut(isSessionEnded: Boolean) {
        links.areEnabled = true
        links.reminderLineOnSignIn = null
        backStack.showAlone(listOf(Destination.SignIn(isSessionEnded = isSessionEnded)))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
    }

    fun openTab(tab: Tab) {
        if (!areLinksEnabled || !backStack.isSignedIn()) return
        backStack.showAlone(listOfNotNull(Destination.Today, tab.root.takeIf { tab != Tab.Today }))
    }

    fun townUnnamed() {
        if (backStack.isSignedIn()) backStack.showAlone(listOf(Destination.Naming))
    }

    fun townNamed() {
        if (backStack.lastOrNull() == Destination.Naming) backStack.showAlone(listOf(Destination.Today))
    }

    fun openSchool() {
        openTab(Tab.Learn)
    }

    fun openLesson(lesson: LessonId, walked: List<LessonId>) {
        if (!areLinksEnabled) return
        val words: Destination.LessonWords = Destination.LessonWords(lesson, walked)
        when (backStack.lastOrNull()) {
            Destination.Today, Destination.Town, Destination.Report, Destination.School -> backStack.add(words)
            is Destination.LessonWords, Destination.Review -> backStack[backStack.lastIndex] = words
            else -> Unit
        }
    }

    fun openReport() {
        openOnTab(Destination.Report)
    }

    fun openAbove(under: Destination, shown: Destination) {
        if (!areLinksEnabled) return
        if (backStack.lastOrNull() == under) backStack.add(shown)
    }

    fun openMap() {
        openOnTab(Destination.Map)
    }

    fun openPlacement() {
        openOnTab(Destination.Placement)
    }

    private fun openOnTab(shownNext: Destination) {
        if (!areLinksEnabled || !backStack.isSignedIn()) return
        backStack.showAlone(listOfNotNull(Destination.Today, backStack.tabUnder().rootAboveToday(), shownNext))
    }

    fun openHoldoutCheck(band: PlacementBand, week: HoldoutCheckWeek) {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Today, Destination.Town, Destination.School ->
                backStack.add(Destination.HoldoutCheck(band, week))
            else -> Unit
        }
    }

    fun openReviews() {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Today, Destination.Town, Destination.Report, Destination.School, is Destination.LessonWords ->
                backStack.add(Destination.Review)
            else -> Unit
        }
    }

    fun openReminder(line: StudyReminderLine) {
        if (!backStack.isSignedIn()) {
            links.reminderLineOnSignIn = line
            return
        }
        if (!areLinksEnabled) return
        backStack.showAlone(listOfNotNull(Destination.Today, line.shownAboveToday()))
    }

    fun openTown() {
        if (backStack.lastOrNull() is Destination.MailedLink) {
            backStack.showAlone(listOf(Destination.SignIn(isSessionEnded = false)))
            return
        }
        openTab(Tab.Town)
    }
}

private fun Tab.rootAboveToday(): Destination? = root.takeIf { this != Tab.Today }

private fun StudyReminderLine.shownAboveToday(): Destination? = when (this) {
    StudyReminderLine.Cards -> Destination.Report
    StudyReminderLine.Check, StudyReminderLine.Lesson -> null
}

private fun List<NavKey>.isSignedIn(): Boolean = firstOrNull() == Destination.Today

private fun MutableList<NavKey>.showAlone(destinations: List<Destination>) {
    if (this == destinations) return
    val replaced: Int = size
    addAll(destinations)
    repeat(replaced) { removeAt(0) }
}
