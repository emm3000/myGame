package com.emm.mygame

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.LessonId
import kotlinx.coroutines.flow.Flow

internal class Navigator(private val backStack: MutableList<NavKey>) {

    var areLinksEnabled: Boolean by mutableStateOf(true)
        private set

    fun signingOut() {
        areLinksEnabled = false
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
        showAlone(listOf(Destination.Town))
    }

    fun signedOut(isSessionEnded: Boolean) {
        areLinksEnabled = true
        showAlone(listOf(Destination.SignIn(isSessionEnded = isSessionEnded)))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
    }

    fun openSchool() {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Town -> backStack.add(Destination.School)
            is Destination.LessonWords -> {
                backToTown()
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
        openFromTown(Destination.Report)
    }

    fun openNews() {
        if (!areLinksEnabled) return
        if (backStack.lastOrNull() == Destination.Report) backStack.add(Destination.News)
    }

    fun openMap() {
        openFromTown(Destination.Map)
    }

    fun openReviews() {
        if (!areLinksEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Town, Destination.Report, Destination.School, is Destination.LessonWords ->
                backStack.add(Destination.Review)
            else -> Unit
        }
    }

    fun openTown() {
        if (backStack.lastOrNull().isAboveTown()) backToTown()
    }

    private fun openFromTown(shownNext: Destination) {
        if (!areLinksEnabled) return
        val shown: NavKey? = backStack.lastOrNull()
        if (shown != Destination.Town && !shown.isAboveTown()) return
        backToTown()
        backStack.add(shownNext)
    }

    private fun backToTown() {
        backStack.subList(backStack.indexOf(Destination.Town) + 1, backStack.size).clear()
    }

    private fun showAlone(destinations: List<Destination>) {
        if (backStack == destinations) return
        val replaced: Int = backStack.size
        backStack.addAll(destinations)
        repeat(replaced) { backStack.removeAt(0) }
    }
}

private fun NavKey?.isAboveTown(): Boolean = when (this) {
    Destination.School,
    Destination.Report,
    Destination.News,
    Destination.Map,
    Destination.Review,
    is Destination.LessonWords,
    -> true
    else -> false
}
