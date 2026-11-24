package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.feature.town.building.CostLine
import com.emm.mygame.feature.town.building.NextLevelLine
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.SlotLine
import com.emm.mygame.feature.town.building.StartStatus
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.StopStatus
import com.emm.mygame.feature.town.building.WaitingLine
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Rule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

abstract class TownScreenFixtures {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    protected val intents: MutableList<TownIntent> = mutableListOf()

    protected var schoolOpens: Int = 0

    protected var mapOpens: Int = 0

    protected val levelTwo: NextLevelLine = NextLevelLine(
        level = 2,
        costs = listOf(CostLine(TownResourceKind.Money, 150, isShort = false)),
        duration = 90.seconds,
        people = 3,
        wordsNeeded = null,
    )

    protected fun placeOf(kind: TownBuildingKind): PlaceCard = PlaceCard(
        kind = kind,
        level = 1,
        raisedFrom = null,
        isInWork = false,
        next = levelTwo,
        block = null,
    )

    protected val street: List<PlaceCard> = streetOrder.map(::placeOf)

    protected val riverton: TownUiState.Content = TownUiState.Content(
        name = "Riverton",
        label = TownLabel.Town,
        stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
            StockLine(kind, 120, capacity = 900, ratePerHour = 30, skillLevel = 0, fill = null)
        },
        people = PeopleLine(free = 24, atWork = 96),
        words = WordsLine(stable = 3, retained = 1),
        season = null,
        buildMark = null,
        slot = SlotLine.Idle,
        waitingList = emptyList(),
        places = street,
        nextStepPlace = TownBuildingKind.School,
        goal = null,
        caughtUpGoal = null,
        newestText = null,
        tip = null,
        start = StartStatus.Idle,
        stop = StopStatus.Idle,
        hiring = idleHiringLine,
    )

    protected val factoryGoal: TownGoal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Underway,
    )

    protected val busyFarm: SlotLine.Busy = SlotLine.Busy(
        building = TownBuildingKind.Farm,
        level = 2,
        remaining = 12.minutes,
        total = 20.minutes,
        finishesAt = readInstant,
    )

    protected val waitingSchool: WaitingLine = WaitingLine(
        building = TownBuildingKind.School,
        level = 2,
        remaining = 20.minutes,
        finishesAt = readInstant,
    )

    protected val summer: SeasonLine = SeasonLine(
        kind = SeasonKind.Summer,
        year = 2,
        remaining = 3.days,
        productionMarks = emptyList(),
    )

    protected fun topOf(text: String): Dp =
        composeRule.onAllNodesWithText(text).onFirst().getUnclippedBoundsInRoot().top

    protected fun tab(place: String): SemanticsNodeInteraction = composeRule.onNode(
        isTab and hasContentDescription(place, substring = true),
    )

    protected fun homeOn(step: NextStep): TownUiState.Content = townOf(nextStep = step).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = TownRequests.none,
        registered = TownRegistered.nothing,
        hiringEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    protected fun inWork(content: TownUiState.Content, vararg kinds: TownBuildingKind): TownUiState.Content =
        content.copy(
            places = content.places.map { place: PlaceCard ->
                if (place.kind in kinds) place.copy(isInWork = true) else place
            },
        )

    protected fun onSchool(school: PlaceCard): TownUiState.Content = riverton.copy(
        places = street.map { place: PlaceCard -> if (place.kind == school.kind) school else place },
    )

    protected val summerBuild: DurationMark = DurationMark(SeasonKind.Summer, percent = 75)

    protected val phoneWindow: DpSize = DpSize(360.dp, 640.dp)

    protected fun showSlowRead() {
        show(TownUiState.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
    }

    protected fun show(
        state: TownUiState,
        ring: @Composable () -> Unit = {},
        status: @Composable () -> Unit = {},
        placement: @Composable () -> Unit = {},
    ) {
        composeRule.setContent { Screen(state = state, ring = ring, status = status, placement = placement) }
    }

    protected fun showState(shown: MutableState<TownUiState>, window: DpSize? = null) {
        composeRule.setContent {
            Box(modifier = if (window == null) Modifier else Modifier.size(window)) {
                Screen(state = shown.value)
            }
        }
    }

    @Composable
    protected fun Screen(
        state: TownUiState,
        ring: @Composable () -> Unit = {},
        status: @Composable () -> Unit = {},
        placement: @Composable () -> Unit = {},
    ) {
        MyGameTheme {
            TownScreen(
                state = state,
                onIntent = { intent: TownIntent -> intents += intent },
                onSchoolOpen = { schoolOpens += 1 },
                onMapOpen = { mapOpens += 1 },
                onTextOpen = {},
                ring = ring,
                status = status,
                placement = placement,
            )
        }
    }

    protected companion object {
        const val PIXEL_TOLERANCE: Float = 0.5f
        const val READING_LINE: String = "Estamos leyendo tu pueblo…"
        const val REVEAL_MARGIN_MILLIS: Long = 50
        const val UNEXPECTED: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOT_ENOUGH: String =
            "No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas."
        const val STREET: String = "Tu pueblo: 7 de 7 construidos"
        const val OFFICE_IDLE: String = "Ahora no hay ninguna contratación."
        const val BUILD_MARK: String = "Verano: las obras tardan el 75 % del tiempo"
        const val STOP_FARM: String = "Parar la obra: Granja, nivel 2"
        const val RING: String = "Ring"
        const val RUNNING: String = "Running lesson"
        const val PLACEMENT: String = "Placement offer"
    }
}
