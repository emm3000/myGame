package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.LessonId
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test

class NavigatorTest {

    private val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    private val sessionEndedSignIn: Destination.SignIn = Destination.SignIn(isSessionEnded = true)

    private val firstListed: FiefId = FiefId("509eadd5-6b34-4ea3-8e91-2b38744bd385")

    private val secondFief: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    private val map: Destination.Map = Destination.Map(firstListed)

    private val chronicle: Destination.Chronicle = Destination.Chronicle(firstListed)

    private val firstLesson: LessonId = LessonId("lesson-1")

    private val secondLesson: LessonId = LessonId("lesson-2")

    private val firstWords: Destination.LessonWords = Destination.LessonWords(firstLesson, walked = emptyList())

    private val secondWords: Destination.LessonWords =
        Destination.LessonWords(secondLesson, walked = listOf(firstLesson))

    @Test
    fun `opens sign-up above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openSignUp()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `returns to sign-in on back from sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when sign-up links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the reset request above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openForgotPassword()

        assertEquals(listOf(signIn, Destination.ForgotPassword), backStack)
    }

    @Test
    fun `returns to sign-in on back from the reset request`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when the reset request links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens no reset request above sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).openForgotPassword()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `leaves the last screen to the system on back`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the town alone once signed up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the town alone once signed in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the school above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openSchool()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `keeps one school when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openSchool()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `opens no school above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openSchool()

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `stays on the Report on a back gesture while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.back()

        assertEquals(listOf<NavKey>(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens no school while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.openSchool()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `returns to the town on back from the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).back()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `returns to the town below the school from the town tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `opens the map in place of the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `opens the chronicle in place of the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `opens the chronicle above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `keeps one chronicle when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `returns to the town below the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the map above the town and pops back to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap(firstListed)
        assertEquals(listOf(Destination.Town, map), backStack)
        navigator.openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `keeps one map when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `returns to the town on back from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the map in place of the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `opens the chronicle in place of the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `returns to the town on back from the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `leaves the back stack unchanged when the map or the chronicle is tapped while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)

        navigator.signingOut()
        navigator.openMap(firstListed)
        navigator.openChronicle(firstListed)

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `disables the tabs while signing out`() {
        val navigator: Navigator = Navigator(mutableListOf(Destination.Town))

        navigator.signingOut()

        assertFalse(navigator.areLinksEnabled)
    }

    @Test
    fun `enables the tabs again for the next session`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()
        navigator.signedOut(isSessionEnded = false)

        navigator.signedIn()
        navigator.openMap(firstListed)

        assertEquals(true to listOf(Destination.Town, map), navigator.areLinksEnabled to backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `leaves sign-in alone with the session-ended line when the session ends above the town`() = runTest {
        val signedInStacks: List<MutableList<NavKey>> = listOf(
            mutableListOf(Destination.Town),
            mutableListOf(Destination.Town),
            mutableListOf(Destination.Town, map),
            mutableListOf(Destination.Town, chronicle),
        )

        signedInStacks.forEach { backStack: MutableList<NavKey> ->
            Navigator(backStack).followSessionEnds(flowOf(Unit))

            assertEquals(listOf(sessionEndedSignIn), backStack)
        }
    }

    @Test
    fun `shows the session-ended line when the session ends on a plain sign-in`() = runTest {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).followSessionEnds(flowOf(Unit))

        assertEquals(listOf(sessionEndedSignIn), backStack)
    }

    @Test
    fun `keeps the sign-in it shows when the session ends again`() = runTest {
        val shown: Destination.SignIn = Destination.SignIn(isSessionEnded = true)
        val backStack: MutableList<NavKey> = mutableListOf(shown)

        Navigator(backStack).followSessionEnds(flowOf(Unit, Unit))

        assertSame(shown, backStack.single())
    }

    @Test
    fun `keeps the map on screen when another fief is chosen, with the town below it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Map(secondFief)), backStack)
    }

    @Test
    fun `keeps the chronicle on screen when another fief is chosen, with the town below it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Chronicle(secondFief)), backStack)
    }

    @Test
    fun `keeps the screen it shows when the fief on screen is chosen`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).switchFief(firstListed)

        assertSame(map, backStack.last())
    }

    @Test
    fun `opens no other fief while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.switchFief(secondFief)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `opens the map of the fief the tab names`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openMap(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Map(secondFief)), backStack)
    }

    @Test
    fun `opens the chronicle of the fief the tab names`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openChronicle(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Chronicle(secondFief)), backStack)
    }

    @Test
    fun `opens no tab above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap(firstListed)
        navigator.openChronicle(firstListed)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `stays on the town when the town tab is tapped`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens no other fief above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `never navigates to the fief`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack)
        val visited: MutableSet<NavKey> = mutableSetOf()

        listOf(
            navigator::signedIn,
            { navigator.openMap(firstListed) },
            { navigator.switchFief(secondFief) },
            { navigator.openChronicle(secondFief) },
            navigator::openTown,
            navigator::back,
        ).forEach { step: () -> Unit ->
            step()
            visited += backStack
        }

        assertEquals(
            setOf(
                Destination.Town,
                Destination.Map(firstListed),
                Destination.Map(secondFief),
                Destination.Chronicle(secondFief),
            ),
            visited,
        )
    }

    @Test
    fun `opens the Report above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `keeps one Report on a second tap of its tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `replaces the school with the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `replaces the map with the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `replaces the Report with the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `returns to the Report from the review on its tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `leaves the school behind on the Report tab from a review opened there`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, Destination.Review)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens no Report from sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openReport()

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `opens the reviews above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openReviews()

        assertEquals(listOf(Destination.Town, Destination.School, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews once on a double tap`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack)

        navigator.openReviews()
        navigator.openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, Destination.Review), backStack)
    }

    @Test
    fun `returns to the Report on back from the review`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `returns to the school on back from a review opened there`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, Destination.Review)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town on its tab from the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `returns to the town on its tab from a review`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `leaves the Report for the map from a review`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `keeps the Report on screen when a fief is chosen`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `leaves sign-in alone when the session ends on the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack).signedOut(isSessionEnded = true)

        assertEquals(listOf<NavKey>(sessionEndedSignIn), backStack)
    }

    @Test
    fun `opens no Report while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.openReport()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `opens no reviews while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens a lesson's words above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.Report, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `takes the place of the lesson it walks on from`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack).openLesson(secondLesson, walked = listOf(firstLesson))

        assertEquals(listOf(Destination.Town, Destination.Report, secondWords), backStack)
    }

    @Test
    fun `takes the place of the reviews that stopped at a finished lesson`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, Destination.Review)

        Navigator(backStack).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `opens no lesson while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens the reviews above a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, firstWords, Destination.Review), backStack)
    }

    @Test
    fun `goes back to the school from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack).openSchool()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, firstWords)

        Navigator(backStack).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `opens the Report tab from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, firstWords)

        Navigator(backStack).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }
}
