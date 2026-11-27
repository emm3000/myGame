package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.unit.height
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private const val MEASURED_TOLERANCE: Float = 1f

private fun spanish(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameNavigationBarTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `a label too wide for its tab at the largest font keeps one line`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameNavigationBar(
                    items = MyGameNavigationItems(
                        listOf(
                            MyGameNavigationItem(spanish("Hoy"), MyGameIcons.today, isOpen = true, onClick = {}),
                            MyGameNavigationItem(spanish("Pueblo"), MyGameIcons.town, isOpen = false, onClick = {}),
                            MyGameNavigationItem(spanish("Aprender"), MyGameIcons.learn, isOpen = false, onClick = {}),
                            MyGameNavigationItem(spanish("Yo"), MyGameIcons.me, isOpen = false, onClick = {}),
                        ),
                    ),
                )
            }
        }

        val oneLineTab: Float = composeRule.onNodeWithContentDescription("Yo").getBoundsInRoot().height.value
        val widestTab: Float = composeRule.onNodeWithContentDescription("Aprender").getBoundsInRoot().height.value

        assertTrue("$widestTab dp against $oneLineTab dp", widestTab <= oneLineTab + MEASURED_TOLERANCE)
    }
}
