package com.emm.mygame.feature.report

import android.content.Context
import android.content.res.Configuration
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private const val LARGEST_FONT_SCALE: Float = 2.0f

private const val REMINDER_OFFER: String = "Activa un recordatorio de estudio"

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ReportRowsAtLargeFontTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `keeps a wrapped row label off the hairlines around it at the largest font`() {
        showRowsAt(LARGEST_FONT_SCALE)

        val label: SemanticsNodeInteraction = composeRule.onNodeWithText(REMINDER_OFFER, useUnmergedTree = true)
        val text: DpRect = label.getUnclippedBoundsInRoot()
        val lineAbove: DpRect = composeRule.onAllNodesWithTag(HAIRLINE)[1].getUnclippedBoundsInRoot()
        val lineBelow: DpRect = composeRule.onAllNodesWithTag(HAIRLINE)[2].getUnclippedBoundsInRoot()

        assertTrue("the label wraps", layoutOf(label).lineCount > 1)
        assertTrue("room above the label", text.top - lineAbove.bottom >= MyGameSpacing.step2)
        assertTrue("room below the label", lineBelow.top - text.bottom >= MyGameSpacing.step2)
    }

    private fun showRowsAt(fontScale: Float) {
        composeRule.setContent {
            val context: Context = LocalContext.current
            val configuration: Configuration = Configuration(context.resources.configuration)
            configuration.fontScale = fontScale
            CompositionLocalProvider(LocalDensity provides Density(context.createConfigurationContext(configuration))) {
                MyGameTheme {
                    ReportRows(isReminderOffered = true, onNewsOpen = {}, onSettingsOpen = {})
                }
            }
        }
    }

    private fun layoutOf(label: SemanticsNodeInteraction): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        label.fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single()
    }
}
