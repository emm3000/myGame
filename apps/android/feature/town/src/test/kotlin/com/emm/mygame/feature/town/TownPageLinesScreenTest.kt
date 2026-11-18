package com.emm.mygame.feature.town

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.NeededWordKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownWorkRefusal
import kotlin.time.Duration
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

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

    private fun show(state: TownUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(state = state, onIntent = {}, onSchoolOpen = {}, onMapOpen = {})
            }
        }
    }
}
