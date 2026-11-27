package com.emm.mygame.feature.school

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import com.emm.mygame.core.designsystem.navigation.MyGameRing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.uitesting.assertRingOnTitleRow
import com.emm.mygame.core.uitesting.tabRingLabel
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class LearnHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `draws Learn's title and the ring on one row`() {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = SchoolUiState.Loading,
                    onIntent = {},
                    onLessonOpen = {},
                    onTextOpen = {},
                    onReviewsOpen = {},
                    ring = { MyGameRing(count = 0, total = 5, countBefore = 0, label = tabRingLabel) },
                )
            }
        }

        assertRingOnTitleRow(composeRule, title = "Aprender")
    }
}
