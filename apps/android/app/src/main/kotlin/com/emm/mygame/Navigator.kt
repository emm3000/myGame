package com.emm.mygame

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.LessonId
import kotlinx.coroutines.flow.Flow

internal class Navigator(private val backStack: MutableList<NavKey>) {

    var areTabsEnabled: Boolean by mutableStateOf(true)
        private set

    fun signingOut() {
        areTabsEnabled = false
    }

    fun back() {
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
        areTabsEnabled = true
        showAlone(listOf(Destination.SignIn(isSessionEnded = isSessionEnded)))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
    }

    fun openMap(fief: FiefId) {
        openTab(Destination.Map(fief))
    }

    fun openChronicle(fief: FiefId) {
        openTab(Destination.Chronicle(fief))
    }

    fun openSchool() {
        if (!areTabsEnabled) return
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
        if (!areTabsEnabled) return
        val words: Destination.LessonWords = Destination.LessonWords(lesson, walked)
        when (backStack.lastOrNull()) {
            Destination.Report, Destination.School -> backStack.add(words)
            is Destination.LessonWords -> backStack[backStack.lastIndex] = words
            else -> Unit
        }
    }

    fun openReport() {
        openTab(Destination.Report)
    }

    fun openReviews() {
        if (!areTabsEnabled) return
        when (backStack.lastOrNull()) {
            Destination.Report, Destination.School, is Destination.LessonWords -> backStack.add(Destination.Review)
            else -> Unit
        }
    }

    fun openTown() {
        if (backStack.lastOrNull().isAboveTown()) backToTown()
    }

    fun switchFief(fief: FiefId) {
        if (!areTabsEnabled) return
        val shown: List<Destination> = when (backStack.lastOrNull()) {
            is Destination.Map -> listOf(Destination.Town, Destination.Map(fief))
            is Destination.Chronicle -> listOf(Destination.Town, Destination.Chronicle(fief))
            else -> return
        }
        showAlone(shown)
    }

    private fun openTab(tab: Destination) {
        if (!areTabsEnabled) return
        val shown: NavKey? = backStack.lastOrNull()
        if (shown != Destination.Town && !shown.isAboveTown()) return
        backToTown()
        backStack.add(tab)
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
    Destination.Review,
    is Destination.LessonWords,
    is Destination.Map,
    is Destination.Chronicle,
    -> true
    else -> false
}
