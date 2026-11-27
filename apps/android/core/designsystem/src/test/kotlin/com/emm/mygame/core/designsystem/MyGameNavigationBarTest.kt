package com.emm.mygame.core.designsystem

import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.height
import androidx.compose.ui.unit.width
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private const val MEASURED_TOLERANCE: Float = 1f

private fun spanish(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private val scaffolded: List<MyGameLabel> = listOf(
    MyGameLabel(text = "Today", translation = "Hoy"),
    MyGameLabel(text = "Town", translation = "Pueblo"),
    MyGameLabel(text = "Learn", translation = "Aprender"),
    MyGameLabel(text = "Me", translation = "Yo"),
)

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

    @Test
    @Config(qualifiers = "es-w360dp-h640dp", fontScale = 2.0f)
    fun `at the largest font in Spanish the four labels keep one size and a gap between neighbours`() {
        setScaffoldedBar()

        val labels: List<DpRect> = scaffolded.map { label: MyGameLabel ->
            composeRule.onNodeWithTag(navigationLabelTagOf(label), useUnmergedTree = true).getBoundsInRoot()
        }
        val heights: Set<Float> = labels.map { label: DpRect -> label.height.value }.toSet()
        assertEquals("one height for four labels of two lines", 1, heights.size)
        labels.zipWithNext { left: DpRect, right: DpRect ->
            val gap: Float = right.left.value - left.right.value
            assertTrue("$gap dp between $left and $right", gap >= MyGameSpacing.step2.value - MEASURED_TOLERANCE)
        }
    }

    @Test
    @Config(qualifiers = "es-w360dp-h640dp")
    fun `at the default font the four tabs share the bar equally`() {
        setScaffoldedBar()

        val widths: List<Float> = scaffolded.map { label: MyGameLabel -> tabBoundsOf(label).width.value }

        assertEquals(listOf(90f, 90f, 90f, 90f), widths)
    }

    @Test
    @Config(qualifiers = "es-w320dp-h640dp", fontScale = 2.0f)
    fun `at the largest font on a bar too narrow for every label each tab keeps a touch target`() {
        setScaffoldedBar()

        scaffolded.forEach { label: MyGameLabel ->
            val width: Float = tabBoundsOf(label).width.value
            assertTrue("${label.text} is $width dp", width >= MyGameSizes.control.value - MEASURED_TOLERANCE)
        }
    }

    private fun setScaffoldedBar() {
        composeRule.setContent {
            MyGameTheme {
                MyGameNavigationBar(
                    items = MyGameNavigationItems(
                        scaffolded.map { label: MyGameLabel ->
                            MyGameNavigationItem(
                                label = label,
                                icon = MyGameIcons.learn,
                                isOpen = label.text == "Learn",
                                onClick = {},
                                count = "3".takeIf { label.text == "Learn" },
                            )
                        },
                    ),
                )
            }
        }
    }

    private fun tabBoundsOf(label: MyGameLabel): DpRect =
        composeRule.onNodeWithContentDescription(label.spoken, substring = true).getBoundsInRoot()
}
