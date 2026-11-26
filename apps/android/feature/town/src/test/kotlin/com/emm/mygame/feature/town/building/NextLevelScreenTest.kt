package com.emm.mygame.feature.town.building

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.projection.town.building.WordNeedLine
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreenFixture
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.placeOf
import com.emm.mygame.feature.town.shortOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NextLevelScreenTest : TownScreenFixture() {

    @Test
    fun `offers the place's next level on its own page`() {
        show(riverton)
        tab("Granja").performScrollTo().performClick()

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.Farm)), intents)
    }

    @Test
    fun `draws the build action outlined`() {
        show(riverton)

        composeRule.onAllNodesWithTag(OUTLINED_PILL).assertCountEquals(1)
    }

    @Test
    fun `draws the level's cost and people on its page`() {
        show(riverton)

        composeRule.onNodeWithText("Gente trabajando: +3").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithContentDescription("150 de dinero").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `says a shortfall of the build in words`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(block = shortOf(TownResourceKind.Food, 20))))

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Necesitas 20 de comida más."))
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `keeps a blocked level tappable`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(block = BlockReason.PeopleShort(5, 2))))

        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performScrollTo().performClick()

        assertEquals(listOf<TownIntent>(TownIntent.BuildTapped(TownBuildingKind.School)), intents)
    }

    @Test
    fun `draws the words a level needs over a segmented track`() {
        val need: WordNeedLine =
            WordNeedLine(needed = 10, held = 4, standing = NeededWordKind.Stable)
        show(onSchool(placeOf(TownBuildingKind.School).copy(next = levelTwo.copy(wordsNeeded = need))))

        composeRule
            .onNodeWithText("Necesita 10 palabras fuera de aprendizaje: 4 de 10")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `draws no words line when the level needs none`() {
        show(riverton)

        composeRule.onAllNodesWithText("Necesita", substring = true).assertCountEquals(0)
    }

    @Test
    fun `a top-level place shows no words, no cost and no build`() {
        show(onSchool(placeOf(TownBuildingKind.School).copy(level = 10, next = null)))

        composeRule.onNodeWithText("Nivel máximo").assertIsDisplayed()
        composeRule.onAllNodesWithText("Necesita", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithContentDescription("de dinero", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("Construir", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws a start refusal on the page of its place`() {
        val refused: StartStatus =
            StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughPeople(5, 2))

        show(riverton.copy(start = refused))

        composeRule
            .onNodeWithText("Esta obra necesita 5 personas libres y tienes 2. Sube el nivel de tus hogares.")
            .performScrollTo()
            .assertIsDisplayed()
    }

    @Test
    fun `brings a start refusal at the end of the page fully into view above the street`() {
        val shown: MutableState<TownUiState> = mutableStateOf(riverton)
        showState(shown, window = phoneWindow)
        composeRule.onNodeWithText("Construir nivel 2 · 1:30").performClick()

        shown.value = riverton.copy(
            start = StartStatus.Refused(TownBuildingKind.School, TownWorkRefusal.NotEnoughResources),
        )
        composeRule.waitForIdle()

        val refusal: DpRect = composeRule.onNodeWithText(NOT_ENOUGH).getUnclippedBoundsInRoot()
        val streetTop: Dp = composeRule.onNode(hasContentDescription(STREET)).getUnclippedBoundsInRoot().top
        assertTrue("refusal ends at ${refusal.bottom}, street starts at $streetTop", refusal.bottom <= streetTop)
        assertTrue("refusal starts at ${refusal.top}", refusal.top >= 0.dp)
    }

    private fun onSchool(school: PlaceCard): TownUiState.Content = riverton.copy(
        places = street.map { place: PlaceCard -> if (place.kind == school.kind) school else place },
    )

    private companion object {
        const val NOT_ENOUGH: String =
            "No tienes recursos suficientes para esta obra. Espera a que crezcan tus reservas."
    }
}
