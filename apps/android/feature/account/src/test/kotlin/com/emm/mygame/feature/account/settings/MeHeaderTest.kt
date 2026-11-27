package com.emm.mygame.feature.account.settings

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.uitesting.assertRingOnTitleRow
import com.emm.mygame.core.uitesting.tabRingLabel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MeHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val loaded: SettingsUiState =
        SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Untouched, firstReminder)

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `draws Me's title and the ring on one row`() {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = loaded,
                    onIntent = {},
                    onNotificationSettingsOpen = {},
                    ring = { MyGameRing(count = 0, total = 5, countBefore = 0, label = tabRingLabel) },
                )
            }
        }

        assertRingOnTitleRow(composeRule, title = "Yo")
    }
}
