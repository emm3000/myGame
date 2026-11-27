package com.emm.mygame.feature.today

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Duration.Companion.minutes

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w360dp-h640dp")
class TodayRowFillsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var colors: MyGameColors? = null

    @Test
    fun `draws a You can do now row on surface-sunken`() {
        show(rowsContent)

        assertEquals(hexOf(colors?.surfaceSunken), hexOf(colorBeside(composeRule.onNode(buildFarm))))
    }

    @Test
    fun `draws a Locked row on surface-sunken`() {
        show(rowsContent)

        assertEquals(hexOf(colors?.surfaceSunken), hexOf(colorBeside(composeRule.onNode(buildSchool))))
    }

    @Test
    fun `draws the work row of In progress on surface-sunken`() {
        show(rowsContent)

        assertEquals(hexOf(colors?.surfaceSunken), hexOf(colorBeside(composeRule.onNode(hasText(FACTORY_WORK)))))
    }

    @Test
    fun `draws the gains on surface-sunken`() {
        show(rowsContent.copy(gained = listOf(TownSnapshot.Cost(TownResourceKind.Food, 30))))

        val gain: SemanticsNodeInteraction = composeRule.onNode(hasText("comida", substring = true))
        assertEquals(hexOf(colors?.surfaceSunken), hexOf(colorBeside(gain)))
    }

    @Test
    fun `draws no hairline between the can-do, locked and work rows`() {
        show(rowsContent)

        assertEquals(0, composeRule.onAllNodesWithTag(HAIRLINE, useUnmergedTree = true).fetchSemanticsNodes().size)
    }

    private fun colorBeside(node: SemanticsNodeInteraction): Color {
        val bounds: DpRect = node.performScrollTo().getBoundsInRoot()
        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val insideFillX: Int = with(composeRule.density) { (bounds.left - 8.dp).roundToPx() }
        val middle: Int = with(composeRule.density) { ((bounds.top + bounds.bottom) / 2).roundToPx() }
        return pixels[insideFillX, middle]
    }

    private fun show(state: TodayUiState) {
        composeRule.setContent {
            MyGameTheme(darkTheme = false) {
                colors = MyGameTheme.colors
                TodayScreen(
                    state = state,
                    onIntent = {},
                    navigation = TodayNavigation(
                        onLessonOpen = {},
                        onReviewsOpen = {},
                        onHoldoutCheckOpen = { _, _ -> },
                        onMapOpen = {},
                        onNewsOpen = {},
                        onTextOpen = {},
                        onNoTown = {},
                    ),
                )
            }
        }
    }

    private fun hexOf(color: Color?): String = Integer.toHexString(color?.toArgb() ?: 0)

    private companion object {
        const val FACTORY_WORK: String = "Fábrica, nivel 3, termina en"

        val buildFarm: SemanticsMatcher = hasText("Construir por 50 de dinero") and hasClickAction()

        val buildSchool: SemanticsMatcher =
            hasText("Construir por 100 de dinero", substring = true) and hasClickAction()

        fun levelTwoCosting(money: Long): NextLevelLine = NextLevelLine(
            level = 2,
            costs = listOf(CostLine(TownResourceKind.Money, money, isShort = false)),
            duration = 3.minutes,
            people = 1,
            wordsNeeded = null,
        )

        val factoryWork: TodayUiState.RunningWork =
            TodayUiState.RunningWork(TownBuildingKind.Factory, level = 3, 5.minutes, readAt + 5.minutes)

        val rowsContent: TodayUiState.Content = TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = TodayUiState.FirstCard.Study(LessonId("lesson-1"), number = 1),
            gained = emptyList(),
            whatHappened = null,
            lesson = null,
            work = factoryWork,
            job = null,
            canDo = listOf(TodayUiState.CanDo(TownBuildingKind.Farm, levelTwoCosting(50))),
            locked = listOf(
                TodayUiState.Locked(TownBuildingKind.School, levelTwoCosting(100), BlockReason.PeopleShort(5, 4)),
            ),
            start = TodayUiState.LessonStart.Idle,
            build = StartStatus.Idle,
            keepGoing = null,
        )
    }
}
