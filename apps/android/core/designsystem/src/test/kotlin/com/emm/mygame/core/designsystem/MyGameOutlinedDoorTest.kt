package com.emm.mygame.core.designsystem

import android.content.Context
import android.content.res.Configuration
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private const val LARGEST: Float = 2.0f

private val narrowWidth: Dp = 200.dp

private const val LABEL: String = "Read all the news"

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameOutlinedDoorTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var opened: Int = 0

    private fun showAt(fontScale: Float) {
        composeRule.setContent {
            val context: Context = LocalContext.current
            val configuration: Configuration = Configuration(context.resources.configuration)
            configuration.fontScale = fontScale
            CompositionLocalProvider(LocalDensity provides Density(context.createConfigurationContext(configuration))) {
                MyGameTheme {
                    Box(modifier = Modifier.width(narrowWidth)) {
                        MyGameOutlinedDoor(
                            label = MyGameLabel(text = LABEL, translation = null),
                            onClick = { opened++ },
                        )
                    }
                }
            }
        }
    }

    @Test
    fun `draws the outlined role with a button role and opens on a tap`() {
        showAt(1f)

        composeRule.onNodeWithTag(OUTLINED_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
            .performClick()

        assertEquals(1, opened)
    }

    @Test
    fun `draws a forward chevron inside its outline after the label`() {
        showAt(1f)

        val chevron: DpRect = composeRule
            .onNode(hasTestTag(PILL_CHEVRON) and hasAnyAncestor(hasTestTag(OUTLINED_PILL)), useUnmergedTree = true)
            .getBoundsInRoot()
        val label: DpRect = composeRule.onNodeWithText(LABEL, useUnmergedTree = true).getBoundsInRoot()

        assertTrue("the chevron follows the label", chevron.left >= label.right)
    }

    @Test
    fun `keeps the chevron inside the outline when the label wraps at the largest font`() {
        showAt(LARGEST)

        val door: DpRect = composeRule.onNodeWithTag(OUTLINED_PILL).getBoundsInRoot()
        val chevron: DpRect = composeRule.onNodeWithTag(PILL_CHEVRON, useUnmergedTree = true).getBoundsInRoot()

        assertTrue("the chevron has width", chevron.right > chevron.left)
        assertTrue("the chevron ends inside the outline", chevron.right <= door.right)
    }

    @Test
    fun `reads its caption inside the door, with its label`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameOutlinedDoor(
                    label = MyGameLabel(text = "Open the check", translation = null),
                    caption = MyGameLabel(text = "Band 2, week 8", translation = null),
                    onClick = {},
                )
            }
        }

        composeRule.onNodeWithTag(OUTLINED_PILL)
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.Text,
                    listOf(AnnotatedString("Open the check"), AnnotatedString("Band 2, week 8")),
                ),
            )
    }
}
