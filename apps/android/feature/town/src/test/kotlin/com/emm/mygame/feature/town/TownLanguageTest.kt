package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundRefusal
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringRefusal
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownWorkRefusal
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import java.util.TimeZone
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "en")
class TownLanguageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val spanishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold)

    private val bothPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)

    private val englishPhase: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)

    private val noScaffold: CopyLanguage = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)

    private val farmShortOfMoneyAndFood: TownSnapshot.Building = TownSnapshot.Building(
        TownBuildingKind.Farm,
        level = 1,
        next = nextLevelOf(
            costs = listOf(
                TownSnapshot.Cost(TownResourceKind.Money, 400),
                TownSnapshot.Cost(TownResourceKind.Food, 300),
            ),
        ),
    )

    private val home: TownUiState.Content = townOf(places = placesOf(farmShortOfMoneyAndFood)).readContent().onFarm()

    private val farmShortOfMoneyFoodAndPower: TownSnapshot.Building = farmShortOfMoneyAndFood.copy(
        next = nextLevelOf(
            costs = listOf(
                TownSnapshot.Cost(TownResourceKind.Money, 400),
                TownSnapshot.Cost(TownResourceKind.Food, 300),
                TownSnapshot.Cost(TownResourceKind.Power, 900_000),
            ),
        ),
    )

    private val homeShortOfThree: TownUiState.Content =
        townOf(places = placesOf(farmShortOfMoneyFoodAndPower)).readContent().onFarm()

    private val homeBuildingForThreeDays: TownUiState.Content =
        townOf(slot = workOf(TownBuildingKind.Farm, lasting = 3.days)).readContent().onFarm()

    private val farmAtLevelTwo: TownUiState.WorkTarget = TownUiState.WorkTarget(TownBuildingKind.Farm, level = 2)

    private val busyFarm: TownUiState.SlotLine.Busy = TownUiState.SlotLine.Busy(
        building = TownBuildingKind.Farm,
        level = 2,
        remaining = 5.minutes,
        total = 10.minutes,
        finishesAt = readInstant + 5.minutes,
    )

    private val homeBuildingTheFarm: TownUiState.Content = home.copy(slot = busyFarm)

    private val listFull: TownUiState.BlockReason = TownUiState.BlockReason.WaitingListFull(cap = 2)

    private val workers: TownUiState.HireCard = TownUiState.HireCard(
        kind = TownHireKind.Worker,
        team = 2,
        requiredOfficeLevel = 1,
        form = TownUiState.HireForm(entry = "3", isEntryDisabled = false, offer = null, block = null),
    )

    private val homeWithWorkers: TownUiState.Content = home.copy(office = home.office.copy(hires = listOf(workers)))

    private val hiringWorkers: TownUiState.HiringLine.Busy = TownUiState.HiringLine.Busy(
        target = TownUiState.HiringTarget(TownHireKind.Worker, readInstant),
        count = 3,
        delivered = 1,
        remaining = 2.minutes,
        total = 3.minutes,
        finishesAt = readInstant + 2.minutes,
    )

    private val homeHiringWorkers: TownUiState.Content =
        homeWithWorkers.copy(office = homeWithWorkers.office.copy(hiring = hiringWorkers))

    private val blankNameRefused: TownUiState.Naming =
        TownUiState.Naming(name = "", status = TownUiState.NamingStatus.Refused(TownFoundRefusal.BlankTownName))

    private val phoneZone: TimeZone = TimeZone.getDefault()

    @Before
    fun drawInUtc() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    @After
    fun restorePhoneZone() {
        TimeZone.setDefault(phoneZone)
    }

    private fun show(language: CopyLanguage, state: TownUiState = home) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    TownScreen(
                        state = state,
                        onIntent = {},
                        onSchoolOpen = {},
                        onMapOpen = {},
                    )
                }
            }
        }
    }

    private fun showStatus(language: CopyLanguage, state: TownStatusUiState) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    TownStatus(state = state, onNoticeClose = {}, onLessonOpen = {}, onReviewsOpen = {})
                }
            }
        }
    }

    private fun assertDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).onFirst().assertExists() }
    }

    private fun assertNotDrawn(vararg lines: String) {
        lines.forEach { line: String -> composeRule.onAllNodesWithText(line).assertCountEquals(0) }
    }

    private fun lineOf(text: String): DpRect =
        composeRule.onAllNodesWithText(text, useUnmergedTree = true).onFirst().getUnclippedBoundsInRoot()

    private fun assertEnglishOverSpanish(english: String, spanish: String) {
        assertTrue("$english over $spanish", lineOf(english).bottom <= lineOf(spanish).top)
    }

    @Test
    fun `draws the town home in Spanish in the Spanish phase`() {
        show(spanishPhase)

        assertDrawn("Riverton · Pueblo", "Edificio 2 de 7", "Granja", "Gente trabajando: +3")
        assertDrawn("Necesitas 300 de dinero y 200 de comida más.")
        assertNotDrawn("Riverton · Town", "Building 2 of 7", "Farm", "People at work: +3")
    }

    @Test
    fun `draws English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish("Riverton · Town", "Riverton · Pueblo")
        assertEnglishOverSpanish("Building 2 of 7", "Edificio 2 de 7")
        assertEnglishOverSpanish("Farm", "Granja")
        assertEnglishOverSpanish("People at work: +3", "Gente trabajando: +3")
    }

    @Test
    fun `draws the office English over Spanish in the both phase`() {
        show(bothPhase, home.onOffice())

        assertEnglishOverSpanish("Hiring", "Contratación")
        assertEnglishOverSpanish("Go to the map", "Ir al mapa")
    }

    @Test
    fun `draws a composed line English over Spanish in the both phase`() {
        show(bothPhase)

        assertEnglishOverSpanish(
            english = "You need 300 money and 200 food more.",
            spanish = "Necesitas 300 de dinero y 200 de comida más.",
        )
    }

    @Test
    fun `draws the town home in English in the English phase`() {
        show(englishPhase)

        assertDrawn("Riverton · Town", "Building 2 of 7", "Farm", "People at work: +3")
        assertDrawn("You need 300 money and 200 food more.")
        assertNotDrawn("Riverton · Pueblo", "Edificio 2 de 7", "Granja", "Gente trabajando: +3")
    }

    @Test
    fun `writes a later finish day the English way in the English phase`() {
        show(englishPhase, homeBuildingForThreeDays)

        composeRule.onNode(hasText("Nov 8", substring = true)).assertExists()
    }

    @Test
    fun `writes a later finish time on the American clock in the English phase`() {
        show(englishPhase, homeBuildingForThreeDays)

        composeRule.onNode(hasText("Nov 8 10:00\u202FAM", substring = true)).assertExists()
    }

    @Test
    fun `joins three shortfalls with a serial comma in the English phase`() {
        show(englishPhase, homeShortOfThree)

        composeRule.onNode(hasText("You need 300 money, 200 food, and ", substring = true)).assertExists()
    }

    @Test
    fun `joins three shortfalls with no comma before y in the Spanish phase`() {
        show(spanishPhase, homeShortOfThree)

        composeRule.onNode(hasText("Necesitas 300 de dinero, 200 de comida y ", substring = true)).assertExists()
    }

    @Test
    fun `draws the town home in English under none`() {
        show(noScaffold)

        assertDrawn("Riverton · Town", "Building 2 of 7", "Farm", "People at work: +3")
        assertDrawn("You need 300 money and 200 food more.")
        assertNotDrawn("Riverton · Pueblo", "Edificio 2 de 7", "Granja", "Gente trabajando: +3")
    }

    @Test
    fun `draws naming in Spanish in the Spanish phase`() {
        show(spanishPhase, blankNameRefused)

        assertDrawn("Ponle nombre a tu pueblo", "Ahora diriges tu propio pueblo.", "Nombre del pueblo", "Empezar")
        assertNotDrawn("Name your town", "You are the mayor.", "Town name", "Start")
    }

    @Test
    fun `draws naming English over Spanish in the both phase`() {
        show(bothPhase, blankNameRefused)

        assertEnglishOverSpanish("Name your town", "Ponle nombre a tu pueblo")
        assertEnglishOverSpanish("You are the mayor.", "Ahora diriges tu propio pueblo.")
        assertEnglishOverSpanish("Start", "Empezar")
    }

    @Test
    fun `draws naming in English under none`() {
        show(noScaffold, blankNameRefused)

        assertDrawn("Name your town", "You are the mayor.", "Town name", "Start", "Write a name for your town.")
        assertDrawn("Sign out")
        assertNotDrawn("Ponle nombre a tu pueblo", "Empezar", "Escribe un nombre para tu pueblo.", "Salir")
    }

    @Test
    fun `draws the fixed copy in Spanish for an es player in the English phase`() {
        show(englishPhase, blankNameRefused)

        assertDrawn("Name your town", "Start", "Escribe un nombre para tu pueblo.", "Salir")
        assertNotDrawn("Write a name for your town.", "Sign out")
    }

    @Test
    fun `draws the fixed copy in Spanish alone in the both phase`() {
        show(bothPhase, TownUiState.Failed)

        assertDrawn("No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento.", "Salir")
        assertNotDrawn("We could not reach the server. Try again in a moment.", "Sign out")
    }

    @Test
    fun `draws the retry English over Spanish in the both phase`() {
        show(bothPhase, TownUiState.Failed)

        assertEnglishOverSpanish("Try again", "Volver a intentarlo")
    }

    @Test
    fun `draws a refused stop of building work in Spanish for an es player in the English phase`() {
        val refused: TownUiState.Content = homeBuildingTheFarm.copy(
            stop = TownUiState.StopStatus.Refused(farmAtLevelTwo, TownWorkRefusal.BuildingWorkNotFound(level = 2)),
        )

        show(englishPhase, refused)

        assertDrawn("La obra del nivel 2 ya no está en la lista. Quizá ya terminó.")
        assertNotDrawn("The work for level 2 is no longer on the list. It may have finished.")
    }

    @Test
    fun `draws a full waiting list in Spanish for an es player in the English phase`() {
        val full: TownUiState.Content = home.copy(
            places = home.places.map { place: TownUiState.PlaceCard ->
                if (place.kind == TownBuildingKind.Farm) place.copy(block = listFull) else place
            },
        )

        show(englishPhase, full)

        assertDrawn("La lista de espera ya tiene 2 obras. Espera a que termine alguna.")
        assertNotDrawn("The waiting list already holds 2 works. Wait for one to finish.")
    }

    @Test
    fun `draws a refused hire in Spanish for an es player in the English phase`() {
        val refused: TownUiState.Content = homeWithWorkers.copy(
            office = homeWithWorkers.office.copy(
                place = TownUiState.HireStatus.Refused(TownHireKind.Worker, TownHiringRefusal.HiringSlotBusy),
            ),
        )

        show(englishPhase, refused.onOffice())

        assertDrawn(HIRING_BUSY_IN_SPANISH)
        assertNotDrawn(HIRING_BUSY_IN_ENGLISH)
    }

    @Test
    fun `draws a refused stop of hiring in Spanish for an es player in the English phase`() {
        val refused: TownUiState.Content = homeHiringWorkers.copy(
            office = homeHiringWorkers.office.copy(
                stop = TownUiState.HireStopStatus.Refused(TownHiringRefusal.HiringSlotBusy),
            ),
        )

        show(englishPhase, refused.onOffice())

        assertDrawn(HIRING_BUSY_IN_SPANISH)
        assertNotDrawn(HIRING_BUSY_IN_ENGLISH)
    }

    @Test
    fun `draws every unreachable answer in Spanish for an es player in the English phase`() {
        val unreachable: TownUiState.Content = homeHiringWorkers.copy(
            slot = busyFarm,
            start = TownUiState.StartStatus.Unreachable(TownBuildingKind.Farm),
            stop = TownUiState.StopStatus.Unreachable(farmAtLevelTwo),
            office = homeHiringWorkers.office.copy(
                place = TownUiState.HireStatus.Unreachable(TownHireKind.Worker),
                stop = TownUiState.HireStopStatus.Unreachable,
            ),
        )

        show(englishPhase, unreachable)
        val onFarm: Int = unreachableLines()
        composeRule.onNode(
            isTab and hasContentDescription("Office, ", substring = true),
        ).performScrollTo().performClick()

        assertEquals(4, onFarm + unreachableLines())
        assertNotDrawn("We could not reach the server. Try again in a moment.")
    }

    @Test
    fun `draws a refused start in Spanish for an es player in the English phase`() {
        val refused: TownUiState.Content = home.copy(
            start = TownUiState.StartStatus.Refused(TownBuildingKind.Farm, TownWorkRefusal.TopLevelReached(level = 5)),
        )

        show(englishPhase, refused)

        assertDrawn("Farm", "Este edificio ya está en su nivel más alto, el 5.")
        assertNotDrawn("This building is already at its top level, 5.")
    }

    @Test
    fun `draws the lesson status English over Spanish in the both phase`() {
        val notice = TownStatusUiState.FinishNotice(LessonName.Shelved(2), firstUnread = null)

        showStatus(bothPhase, TownStatusUiState(running = null, notice = notice))

        assertEnglishOverSpanish("Lesson 2 is done.", "La lección 2 terminó.")
        assertEnglishOverSpanish("Start the reviews", "Empezar los repasos")
        assertEnglishOverSpanish("Close", "Cerrar")
    }

    @Test
    fun `announces both lines of the finish notice in the both phase`() {
        val notice = TownStatusUiState.FinishNotice(LessonName.Shelved(2), firstUnread = null)

        showStatus(bothPhase, TownStatusUiState(running = null, notice = notice))

        composeRule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion))
            .assert(hasText("Lesson 2 is done."))
            .assert(hasText("La lección 2 terminó."))
    }

    @Test
    fun `draws the lesson countdown in English in the English phase`() {
        val running =
            TownStatusUiState.RunningLesson(LessonName.Shelved(3), remaining = 5.minutes, finishesAt = readInstant)

        showStatus(englishPhase, TownStatusUiState(running = running, notice = null))

        assertDrawn("Lesson 3 ready in")
        assertNotDrawn("Lección 3 lista en")
    }

    private fun unreachableLines(): Int =
        composeRule.onAllNodesWithText(UNREACHABLE_IN_SPANISH, useUnmergedTree = true).fetchSemanticsNodes().size

    private fun TownUiState.Content.onFarm(): TownUiState.Content = copy(nextStepPlace = TownBuildingKind.Farm)

    private fun TownUiState.Content.onOffice(): TownUiState.Content = copy(nextStepPlace = TownBuildingKind.Office)

    private companion object {
        const val HIRING_BUSY_IN_SPANISH: String = "Ya tienes una contratación en curso. Espera a que termine."
        const val HIRING_BUSY_IN_ENGLISH: String = "You are already hiring. Wait for that hiring to end."
        const val UNREACHABLE_IN_SPANISH: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
    }

    private fun TownSnapshot.readContent(): TownUiState.Content = contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )
}
