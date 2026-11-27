package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownSignOutScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws no sign-out under the naming form`() {
        show(emptyNaming())

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    @Test
    fun `draws no sign-out under a failed read`() {
        show(TownUiState.Failed)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    private fun show(state: TownUiState) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    place = null,
                    onIntent = {},
                    onPlaceOpen = {},
                    onNewsOpen = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                )
            }
        }
    }
}
