package com.emm.mygame.feature.town.naming

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.emm.mygame.core.model.town.TownFoundRefusal
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.TownScreenFixture
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.emptyNaming
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NamingSectionScreenTest : TownScreenFixture() {

    @Test
    fun `asks for the town's name`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Ponle nombre a tu pueblo").assertIsDisplayed()
    }

    @Test
    fun `sends what the player writes`() {
        show(emptyNaming())

        composeRule.onNodeWithContentDescription("Nombre del pueblo").performTextInput("Riverton")

        assertEquals(listOf<TownIntent>(TownIntent.NameChanged("Riverton")), intents)
    }

    @Test
    fun `submits the name`() {
        show(emptyNaming())

        composeRule.onNodeWithText("Empezar").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.NameSubmitted), intents)
    }

    @Test
    fun `draws a blank name refusal`() {
        show(TownUiState.Naming("", NamingStatus.Refused(TownFoundRefusal.BlankTownName)))

        composeRule.onNodeWithText("Escribe un nombre para tu pueblo.").assertIsDisplayed()
    }

    @Test
    fun `offers the town a player already holds`() {
        show(TownUiState.Naming("R", NamingStatus.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown)))

        composeRule.onNodeWithText("Ir a tu pueblo").performClick()

        assertEquals(listOf<TownIntent>(TownIntent.GoToTownTapped), intents)
    }

    @Test
    fun `draws a failed founding beside its button`() {
        show(TownUiState.Naming("R", NamingStatus.Unreachable))

        composeRule.onNodeWithText(UNEXPECTED).assertIsDisplayed()
    }
}
