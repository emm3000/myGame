package com.emm.mygame.feature.map

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isFocused
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.requestFocus
import androidx.test.platform.app.InstrumentationRegistry
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.MarchRefusal
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MapFocusTest {

    @get:Rule(order = 0)
    val touchMode: TestRule = TestRule { base: Statement, _: Description ->
        InstrumentationRegistry.getInstrumentation().setInTouchMode(true)
        base
    }

    @get:Rule(order = 1)
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `a march sent by the button leaves no field focused`() {
        val form: MutableState<MapUiState.MarchForm> = mutableStateOf(forageForm(send = MapUiState.SendStatus.Idle))
        drawForm(form) { intent: MapIntent ->
            if (intent is MapIntent.SendTapped) form.value = forageForm(send = MapUiState.SendStatus.Waiting)
        }
        composeRule.onNodeWithContentDescription("Infantes a enviar").requestFocus()

        composeRule.onNodeWithText("Enviar una marcha").performClick()

        assertNoFieldFocused()
    }

    @Test
    fun `a march sent by the keyboard leaves no field focused`() {
        val form: MutableState<MapUiState.MarchForm> = mutableStateOf(foundingForm(send = MapUiState.SendStatus.Idle))
        drawForm(form) { intent: MapIntent ->
            if (intent is MapIntent.SendTapped) form.value = foundingForm(send = MapUiState.SendStatus.Waiting)
        }
        composeRule.onNodeWithContentDescription("Nombre del nuevo feudo").requestFocus()

        composeRule.onNodeWithContentDescription("Nombre del nuevo feudo").performImeAction()

        assertNoFieldFocused()
    }

    @Test
    fun `a refused march leaves no field focused once its fields are writable again`() {
        val form: MutableState<MapUiState.MarchForm> = mutableStateOf(forageForm(send = MapUiState.SendStatus.Idle))
        drawForm(form) { intent: MapIntent ->
            if (intent is MapIntent.SendTapped) form.value = forageForm(send = MapUiState.SendStatus.Waiting)
        }
        composeRule.onNodeWithContentDescription("Horas de forrajeo").requestFocus()
        composeRule.onNodeWithText("Enviar una marcha").performClick()

        form.value = forageForm(send = MapUiState.SendStatus.Refused(MarchRefusal.MarchSlotBusy))

        assertNoFieldFocused()
    }

    @Test
    fun `a province jump by the button leaves the field unfocused`() {
        drawProvince {}
        jumpField().requestFocus()

        composeRule.onNode(hasText("Ir a la provincia") and isButton()).performClick()

        jumpField().assertIsNotFocused()
    }

    @Test
    fun `a province jump by the keyboard leaves the field unfocused`() {
        drawProvince {}
        jumpField().requestFocus()

        jumpField().performImeAction()

        jumpField().assertIsNotFocused()
    }

    private fun jumpField(): SemanticsNodeInteraction =
        composeRule.onNode(hasContentDescription("Ir a la provincia") and hasSetTextAction())

    private fun isButton(): SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)

    private fun drawProvince(onIntent: (MapIntent) -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                ProvinceView(
                    content = MapUiState.Content(
                        map = ProvinceMap(
                            kingdom = 1,
                            province = 3,
                            lastProvince = 9,
                            terrain = Terrain.Lowlands,
                            plots = listOf(MapPlot(plot = 7, holder = PlotHolder.Free)),
                        ),
                        jumpEntry = "5",
                        offers = emptyList(),
                        form = null,
                        sent = null,
                    ),
                    onIntent = onIntent,
                )
            }
        }
    }

    private fun assertNoFieldFocused() {
        composeRule.onAllNodes(isFocused()).assertCountEquals(0)
    }

    private fun drawForm(form: MutableState<MapUiState.MarchForm>, onIntent: (MapIntent) -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                MarchFormView(form = form.value, onIntent = onIntent)
            }
        }
    }

    private fun forageForm(send: MapUiState.SendStatus): MapUiState.ForageForm = MapUiState.ForageForm(
        target = PlotAddress(province = 3, plot = 7),
        atHome = listOf(UnitCount(UnitKind.Infantry, 12)),
        entries = listOf(MapUiState.PartyEntry(UnitKind.Infantry, "1")),
        hoursEntry = "1",
        maxStayHours = 8,
        isFieldLocked = send == MapUiState.SendStatus.Waiting,
        preview = null,
        block = null,
        send = send,
    )

    private fun foundingForm(send: MapUiState.SendStatus): MapUiState.FoundingForm = MapUiState.FoundingForm(
        target = PlotAddress(province = 3, plot = 7),
        settlersAtHome = 3,
        nameEntry = "Vega",
        isFieldLocked = send == MapUiState.SendStatus.Waiting,
        preview = null,
        block = null,
        send = send,
    )
}
