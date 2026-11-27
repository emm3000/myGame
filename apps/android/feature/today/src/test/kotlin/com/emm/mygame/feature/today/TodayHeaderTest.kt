package com.emm.mygame.feature.today

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import com.emm.mygame.core.designsystem.MyGameRing
import com.emm.mygame.core.designsystem.MyGameTheme
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
class TodayHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `draws Today's title and the ring on one row`() {
        composeRule.setContent {
            MyGameTheme {
                TodayScreen(
                    state = TodayUiState.Loading,
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
                    ring = { MyGameRing(count = 0, total = 5, countBefore = 0, label = tabRingLabel) },
                )
            }
        }

        assertRingOnTitleRow(composeRule, title = "Hoy")
    }
}
