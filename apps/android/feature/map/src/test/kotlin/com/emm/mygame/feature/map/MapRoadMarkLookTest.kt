package com.emm.mygame.feature.map

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.ui.SEASON_MARK_ICON
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MapRoadMarkLookTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val pay: List<MapUiState.PayLine> = listOf(
        MapUiState.PayLine(TownResourceKind.Money, 120L),
        MapUiState.PayLine(TownResourceKind.Material, 40L),
    )

    private val fallRoad: MapUiState.DurationMark = MapUiState.DurationMark(SeasonKind.Fall, percent = 75)

    private val jobForm: MapUiState.JobForm = MapUiState.JobForm(
        site = 1,
        workers = "2",
        trucks = "1",
        hours = "2",
        workersAtHome = 3,
        trucksAtHome = 1,
        block = null,
        roadMark = null,
        quote = MapUiState.PayQuote.Quoted(pay),
    )

    private val cleanUpForm: MapUiState.CleanUpForm = MapUiState.CleanUpForm(
        site = 4,
        workers = "3",
        trucks = "1",
        workersAtHome = 3,
        trucksAtHome = 1,
        block = null,
        roadMark = null,
        quote = MapUiState.CleanUpQuote.Quoted(strength = 8, waste = 12, pay = pay, isShort = false),
    )

    @Test
    fun `draws the road mark directly above the send button of the job form`() {
        show(jobForm.copy(roadMark = fallRoad))

        assertTrue(topOf(JOB_PAY) < topOf(FALL_ROAD))
        assertTrue(topOf(FALL_ROAD) < topOf(SEND))
    }

    @Test
    fun `draws the road mark directly above the send button of the clean-up form`() {
        show(cleanUpForm.copy(roadMark = fallRoad))

        assertTrue(topOf(CLEAN_UP_PAY) < topOf(FALL_ROAD))
        assertTrue(topOf(FALL_ROAD) < topOf(SEND))
    }

    @Test
    fun `draws no road mark on a job while the overview answers none`() {
        show(jobForm)

        composeRule.onAllNodesWithText("el camino tarda", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws no road mark on a clean-up while the overview answers none`() {
        show(cleanUpForm)

        composeRule.onAllNodesWithText("el camino tarda", substring = true).assertCountEquals(0)
    }

    @Test
    fun `sets the road mark in caption`() {
        show(jobForm.copy(roadMark = fallRoad))

        assertEquals(MyGameTypography.caption.fontSize, textStyleOf(FALL_ROAD).fontSize)
    }

    @Test
    fun `sets the road mark in ink-muted`() {
        var inkMuted: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inkMuted = MyGameTheme.colors.inkMuted
                MapScreen(state = mapWith(jobForm.copy(roadMark = fallRoad)), onIntent = { })
            }
        }

        assertEquals(inkMuted, textStyleOf(FALL_ROAD).color)
    }

    @Test
    fun `names each season on the road mark`() {
        val map: MutableState<MapUiState> = mutableStateOf(mapWith(jobForm))
        composeRule.setContent { MyGameTheme { MapScreen(state = map.value, onIntent = { }) } }

        seasonWords.forEach { (season: SeasonKind, word: String) ->
            map.value = mapWith(jobForm.copy(roadMark = MapUiState.DurationMark(season, percent = 75)))
            composeRule.waitForIdle()

            composeRule.onNodeWithText("$word: el camino tarda el 75 % del tiempo").assertExists()
        }
    }

    @Test
    fun `draws each season's icon beside the road mark`() {
        val map: MutableState<MapUiState> = mutableStateOf(mapWith(jobForm))
        composeRule.setContent { MyGameTheme { MapScreen(state = map.value, onIntent = { }) } }

        seasonIcons.forEach { (season: SeasonKind, icon: ImageVector) ->
            map.value = mapWith(jobForm.copy(roadMark = MapUiState.DurationMark(season, percent = 75)))
            composeRule.waitForIdle()

            composeRule.onNode(markOf(icon, text = "el camino tarda el 75 % del tiempo")).assertExists()
        }
    }

    @Test
    fun `prints the road percent as sent`() {
        show(cleanUpForm.copy(roadMark = MapUiState.DurationMark(SeasonKind.Winter, percent = 125)))

        composeRule.onNodeWithText("Invierno: el camino tarda el 125 % del tiempo").assertExists()
    }

    private fun markOf(icon: ImageVector, text: String): SemanticsMatcher =
        SemanticsMatcher.expectValue(SEASON_MARK_ICON, icon) and hasAnyDescendant(hasText(text, substring = true))

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun topOf(text: String): Dp =
        composeRule.onAllNodesWithText(text, useUnmergedTree = true).onLast().getUnclippedBoundsInRoot().top

    private fun show(form: MapUiState.SiteForm) {
        composeRule.setContent { MyGameTheme { MapScreen(state = mapWith(form), onIntent = { }) } }
    }

    private fun mapWith(form: MapUiState.SiteForm): MapUiState.Content = MapUiState.Content(
        areaLine = MapUiState.AreaLine(area = 1, terrain = Terrain.Fields),
        previousArea = null,
        nextArea = 2,
        sites = listOf(
            MapUiState.SiteRow.Free(site = 1),
            MapUiState.SiteRow.Waste(site = 4, size = WasteSize.Medium, waste = 12),
        ),
        form = form,
        send = MapUiState.SendRequest.Idle,
        jobOut = null,
        callBack = MapUiState.CallBackRequest.Idle,
    )

    private companion object {
        const val FALL_ROAD: String = "Otoño: el camino tarda el 75 % del tiempo"
        const val SEND: String = "Enviar el equipo"
        const val JOB_PAY: String = "Este trabajo paga 120 de dinero y 40 de material"
        const val CLEAN_UP_PAY: String = "Limpiar los residuos paga 120 de dinero y 40 de material"

        val seasonWords: Map<SeasonKind, String> = mapOf(
            SeasonKind.Spring to "Primavera",
            SeasonKind.Summer to "Verano",
            SeasonKind.Fall to "Otoño",
            SeasonKind.Winter to "Invierno",
        )

        val seasonIcons: Map<SeasonKind, ImageVector> = mapOf(
            SeasonKind.Spring to MyGameIcons.spring,
            SeasonKind.Summer to MyGameIcons.summer,
            SeasonKind.Fall to MyGameIcons.fall,
            SeasonKind.Winter to MyGameIcons.winter,
        )
    }
}
