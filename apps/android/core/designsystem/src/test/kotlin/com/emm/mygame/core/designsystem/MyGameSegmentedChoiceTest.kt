package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.control.MyGameSegment
import com.emm.mygame.core.designsystem.control.MyGameSegmentedChoice
import com.emm.mygame.core.designsystem.control.MyGameSegments
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.lightColors
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private val phoneContent: Dp = 320.dp

private val themes: List<String> = listOf("System", "Light", "Dark")

@RunWith(RobolectricTestRunner::class)
class MyGameSegmentedChoiceTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val picks: MutableList<String> = mutableListOf()

    private fun show(chosen: String, labels: List<String> = themes) {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.width(phoneContent)) {
                    MyGameSegmentedChoice(
                        groupName = "Theme",
                        segments = MyGameSegments(
                            labels.map { theme: String ->
                                MyGameSegment(label = theme, isChosen = theme == chosen, onClick = { picks += theme })
                            },
                        ),
                    )
                }
            }
        }
    }

    private fun segment(label: String): SemanticsNodeInteraction =
        composeRule.onNode(isSelectable() and hasText(label))

    @Test
    fun `draws the three segments in one row`() {
        show(chosen = "System")

        val tops: List<Float> = themes.map { theme: String -> segment(theme).getBoundsInRoot().top.value }

        assertEquals(listOf(tops.first(), tops.first(), tops.first()), tops)
    }

    @Test
    fun `stacks the segments when one label does not fit its share of the row`() {
        val labels: List<String> = listOf("Follow the phone's setting", "Light", "Dark")
        show(chosen = "Light", labels = labels)

        val tops: List<Float> = labels.map { label: String -> segment(label).getBoundsInRoot().top.value }

        assertEquals(tops.sorted().distinct(), tops)
        assertEquals(phoneContent, segment("Light").getBoundsInRoot().let { it.right - it.left })
    }

    @Test
    fun `marks only the chosen segment as selected`() {
        show(chosen = "Light")

        segment("Light").assertIsSelected()
        segment("System").assertIsNotSelected()
        segment("Dark").assertIsNotSelected()
    }

    @Test
    fun `offers each segment as a radio button at least 48 dp tall`() {
        show(chosen = "System")

        themes.forEach { theme: String ->
            segment(theme)
                .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.RadioButton))
                .assertHeightIsAtLeast(MyGameSizes.control)
        }
    }

    @Test
    fun `hands the tapped segment to its own callback`() {
        show(chosen = "System")

        segment("Dark").performClick()

        assertEquals(listOf("Dark"), picks)
    }

    @Test
    fun `fills the chosen segment with ink and leaves the others on the surface`() {
        show(chosen = "System")

        val pixels: PixelMap = segment("System").captureToImage().toPixelMap()
        val others: PixelMap = segment("Light").captureToImage().toPixelMap()
        val inside: Int = with(composeRule.density) { MyGameSpacing.step1.roundToPx() }

        assertEquals("the chosen ground", hexOf(lightColors.ink), hexOf(pixels[inside, pixels.height / 2]))
        assertEquals("another ground", hexOf(lightColors.surface), hexOf(others[inside, others.height / 2]))
    }
}

private fun hexOf(color: Color): String = Integer.toHexString(color.toArgb())
