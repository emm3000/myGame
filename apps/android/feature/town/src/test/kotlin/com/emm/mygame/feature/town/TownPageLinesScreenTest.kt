package com.emm.mygame.feature.town

import android.view.View
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days

@RunWith(RobolectricTestRunner::class)
class TownPageLinesScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val home: TownUiState.Content = townOf().contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    private val factoryGoal: TownGoal = TownGoal(
        position = 2,
        count = 9,
        building = TownBuildingKind.Factory,
        level = 1,
        state = TownGoal.State.Underway,
    )

    private val factoryGoalLine: String = "Meta 2 de 9: Fábrica, nivel 1"

    private val pagesBesideTheFactory: List<String> =
        listOf("Hogares", "Granja", "Escuela", "Oficina", "Central eléctrica", "Almacén")

    private val newestText: NextStepText = NextStepText(TextId("text-31"), "The New Shop")

    private val newestTextLine: String = "Lee: The New Shop"

    private var ground: Color = Color.Unspecified

    private var shownView: View? = null

    @Test
    fun `draws the caught-up goal under the season line on every page but the goal building's`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))

        val drawn: List<String> = pagesBesideTheFactory.filter { place: String ->
            tab(place).performScrollTo().performClick()
            val season: Float = composeRule.onNodeWithText("año 1", substring = true).getBoundsInRoot().bottom.value
            val goal: Float = composeRule.onNodeWithText(factoryGoalLine).getBoundsInRoot().top.value
            goal >= season
        }

        assertEquals(pagesBesideTheFactory, drawn)
    }

    @Test
    fun `a caught-up next step names the newest text`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, newestText)))

        composeRule.onNodeWithText(newestTextLine).assertIsDisplayed()
    }

    @Test
    fun `a running lesson names it beside the goal`() {
        show(homeOn(NextStep.LessonRunning(factoryGoal, newestText)))
        tab("Fábrica").performScrollTo().performClick()

        composeRule.onNodeWithText("En construcción").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText(newestTextLine).assertIsDisplayed()
    }

    @Test
    fun `names no text before the stage opens one`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))

        composeRule.onAllNodesWithText("Lee:", substring = true).assertCountEquals(0)
    }

    @Test
    fun `opens the newest text's screen on a tap of its line`() {
        val opened: MutableList<TextId> = mutableListOf()
        show(homeOn(NextStep.LessonRunning(goal = null, newestText)), onTextOpen = { text: TextId -> opened += text })

        composeRule.onNodeWithText(newestTextLine).performClick()

        assertEquals(listOf(TextId("text-31")), opened)
    }

    @Test
    fun `draws the header's goal line as static text`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))
        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText(factoryGoalLine).assert(SemanticsMatcher.keyNotDefined(SemanticsActions.OnClick))
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `draws the header's goal line with no outline`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))
        tab("Granja").performScrollTo().performClick()

        val image: ImageBitmap = composeRule.onNodeWithText(factoryGoalLine).captureToImage()
        val edges: List<Int> = edgesOf(image)

        assertTrue("every edge is ground", edges.all { pixel: Int -> pixel == ground.toArgb() })
    }

    @Test
    fun `draws the goal once on the goal building's page, in its goal block`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))

        tab("Fábrica").assertIsSelected()
        composeRule.onAllNodesWithText(factoryGoalLine).assertCountEquals(0)
        composeRule.onAllNodesWithText("Cerrar la meta").assertCountEquals(1)
        composeRule.onAllNodesWithText("En construcción").assertCountEquals(1)
    }

    @Test
    fun `reads the goal line right after the page's position when no season is in force`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null), season = null))
        tab("Granja").performScrollTo().performClick()

        val spoken: List<String> = composeRule.spokenOrder(checkNotNull(shownView))
        val position: Int = spoken.indexOfFirst { label: String -> label.startsWith("Edificio ") }

        assertTrue("the page's position is read", position >= 0)
        assertEquals(factoryGoalLine, spoken.getOrNull(position + 1))
    }

    @Test
    fun `draws no goal line in the header while a lesson runs toward the goal`() {
        show(homeOn(NextStep.LessonRunning(factoryGoal, text = null)))
        tab("Granja").performScrollTo().performClick()

        composeRule.onAllNodesWithText(factoryGoalLine).assertCountEquals(0)
    }

    @Test
    fun `draws no goal line in the header once the goal is closed`() {
        val closedGoal: ClosedGuidance = ClosedGuidance(tips = emptySet(), isGoalClosed = true)
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null), closedGoal))
        tab("Granja").performScrollTo().performClick()

        composeRule.onAllNodesWithText(factoryGoalLine).assertCountEquals(0)
    }

    @Test
    fun `reads the goal line after the page's position and before the place's name`() {
        show(homeOn(NextStep.CaughtUp(CaughtUpReason.LessonsDone, factoryGoal, text = null)))
        tab("Granja").performScrollTo().performClick()

        val spoken: List<String> = composeRule.spokenOrder(checkNotNull(shownView))
        val position: Int = spoken.indexOfFirst { label: String -> label.startsWith("Edificio ") }
        val goal: Int = spoken.indexOf(factoryGoalLine)
        val name: Int = spoken.indexOf("Granja")

        assertEquals(listOf(position, goal, name).sorted(), listOf(position, goal, name))
        assertTrue("each line is read", listOf(position, goal, name).none { index: Int -> index < 0 })
    }

    @Test
    fun `shows the earned skill beside its resource on storage's page`() {
        val skilled: List<TownUiState.StockLine> = home.stocks.map { stock: TownUiState.StockLine ->
            if (stock.kind == TownResourceKind.Money) stock.copy(skillLevel = 2) else stock
        }
        show(home.copy(stocks = skilled))

        tab("Almacén").performScrollTo().performClick()

        composeRule.onNodeWithText("Habilidad de dinero, nivel 2").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the stable word refusal on the page of its place`() {
        val refused: TownUiState.StartStatus = TownUiState.StartStatus.Refused(
            TownBuildingKind.Farm,
            TownWorkRefusal.NotEnoughWords(needed = 10, held = 9, standing = NeededWordKind.Stable),
        )
        show(home.copy(start = refused))

        tab("Granja").performScrollTo().performClick()

        composeRule
            .onNodeWithText(
                "Este nivel necesita 10 palabras fuera de aprendizaje y tienes 9. " +
                    "Estudia lecciones nuevas y repasa las palabras que te tocan.",
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws the retained word refusal on the page of its place`() {
        val refused: TownUiState.StartStatus = TownUiState.StartStatus.Refused(
            TownBuildingKind.Farm,
            TownWorkRefusal.NotEnoughWords(needed = 50, held = 49, standing = NeededWordKind.Retained),
        )
        show(home.copy(start = refused))

        tab("Granja").performScrollTo().performClick()

        composeRule
            .onNodeWithText(
                "Este nivel necesita 50 palabras aprendidas y tienes 49. " +
                    "Estudia lecciones nuevas y repasa las palabras que te tocan.",
            )
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `tells a finished work on its place's page until the next read`() {
        show(home.copy(slot = TownUiState.SlotLine.Done(TownBuildingKind.Farm, 2)))

        tab("Granja").performScrollTo().performClick()

        composeRule
            .onNodeWithText("La obra está lista. Estamos leyendo tu pueblo otra vez…")
            .performScrollTo()
            .assertIsDisplayed()
    }

    private fun tab(place: String): SemanticsNodeInteraction = composeRule.onNode(
        isTab and hasContentDescription(place, substring = true),
    )

    private fun homeOn(
        step: NextStep,
        closed: ClosedGuidance = ClosedGuidance.none,
        season: SeasonInForce? = seasonOf(SeasonKind.Summer),
    ): TownUiState.Content = townOf(
        nextStep = step,
        seasonInForce = season,
        seasonEndsAt = if (season == null) null else readInstant + 3.days,
    ).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = closed,
    )

    private fun edgesOf(image: ImageBitmap): List<Int> {
        val pixels: PixelMap = image.toPixelMap()
        val top: List<Int> = (0 until image.width).map { x: Int -> pixels[x, 0].toArgb() }
        val bottom: List<Int> = (0 until image.width).map { x: Int -> pixels[x, image.height - 1].toArgb() }
        return top + bottom
    }

    private fun show(state: TownUiState, onTextOpen: (TextId) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                ground = MyGameTheme.colors.surface
                shownView = LocalView.current
                TownScreen(state = state, onIntent = {}, onSchoolOpen = {}, onMapOpen = {}, onTextOpen = onTextOpen)
            }
        }
    }
}
