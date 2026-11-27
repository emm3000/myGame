package com.emm.mygame.feature.account.settings

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.SemanticsNodeInteractionCollection
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.theme.ThemePick
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private val touchFloor: Dp = 48.dp

@RunWith(RobolectricTestRunner::class)
@Config(fontScale = 2.0f, qualifiers = "es-w360dp-h640dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MeAtLargeFontTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val reminderOnAndDenied: SettingsUiState = SettingsUiState.Loaded(
        PlayerScaffold.Spanish,
        SettingsUiState.Change.Saved,
        firstReminder.copy(isOn = true, ask = SettingsUiState.NotificationAsk.Denied),
    )

    private val reminderOffered: SettingsUiState = SettingsUiState.Loaded(
        PlayerScaffold.None,
        SettingsUiState.Change.Untouched,
        firstReminder.copy(isOffered = true),
    )

    private fun draw(state: SettingsUiState) {
        composeRule.setContent {
            MyGameTheme {
                SettingsScreen(
                    state = state,
                    onIntent = {},
                    onNotificationSettingsOpen = {},
                    themeChoice = {
                        ThemeChoiceScreen(state = ThemeChoiceUiState(ThemePick.System), onIntent = {})
                    },
                )
            }
        }
    }

    @Test
    fun `shows every label on Me whole, by word, at double font in Spanish on a small phone`() {
        draw(reminderOnAndDenied)

        assertEveryLabelWhole()
    }

    @Test
    fun `shows every label on Me whole with the reminder offered at double font in Spanish on a small phone`() {
        draw(reminderOffered)

        assertEveryLabelWhole()
    }

    @Test
    fun `keeps every tappable node on Me at least 48 dp at double font in Spanish on a small phone`() {
        draw(reminderOnAndDenied)

        assertEveryTargetAtTheFloor()
    }

    @Test
    fun `keeps every tappable node at least 48 dp with the reminder offered at double font in Spanish`() {
        draw(reminderOffered)

        assertEveryTargetAtTheFloor()
    }

    private fun assertEveryLabelWhole() {
        val labels: List<SemanticsNode> = composeRule
            .onAllNodes(hasTextLayout, useUnmergedTree = true)
            .fetchSemanticsNodes()
        assertTrue("Me draws its labels", labels.isNotEmpty())
        labels.forEach { node: SemanticsNode ->
            val text: String = textOf(node)
            val layout: TextLayoutResult = layoutOf(node)
            assertTrue("\"$text\" runs past its box", !layout.didOverflowHeight && linesFit(layout))
            (0 until layout.lineCount).forEach { line: Int ->
                assertTrue("\"$text\" is cut on line $line", !layout.isLineEllipsized(line))
            }
            assertTrue("\"$text\" breaks mid-word as ${linesOf(text, layout)}", breaksByWord(text, layout))
        }
    }

    private fun assertEveryTargetAtTheFloor() {
        val targets: SemanticsNodeInteractionCollection = composeRule.onAllNodes(hasClickAction())
        val count: Int = targets.fetchSemanticsNodes().size
        assertTrue("Me draws its controls", count > 0)
        (0 until count).forEach { index: Int ->
            val target: SemanticsNodeInteraction = targets[index]
            val bounds: DpRect = target.getUnclippedBoundsInRoot()
            val name: String = nameOf(target.fetchSemanticsNode())
            assertTrue("\"$name\" is ${bounds.bottom - bounds.top} tall", bounds.bottom - bounds.top >= touchFloor)
            assertTrue("\"$name\" is ${bounds.right - bounds.left} wide", bounds.right - bounds.left >= touchFloor)
        }
    }
}

private val hasTextLayout: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsActions.GetTextLayoutResult)

private fun layoutOf(node: SemanticsNode): TextLayoutResult {
    val layouts: MutableList<TextLayoutResult> = mutableListOf()
    node.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
    return layouts.first()
}

private fun textOf(node: SemanticsNode): String =
    node.config.getOrNull(SemanticsProperties.Text)?.joinToString(separator = "") { it.text }.orEmpty()

private fun nameOf(node: SemanticsNode): String =
    node.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString()
        ?: node.config.getOrNull(SemanticsProperties.Text)?.joinToString { it.text }
        ?: node.id.toString()

private fun linesFit(layout: TextLayoutResult): Boolean =
    (0 until layout.lineCount).all { line: Int ->
        layout.getLineRight(line) - layout.getLineLeft(line) <= layout.size.width + 1f
    }

private fun breaksByWord(text: String, layout: TextLayoutResult): Boolean =
    (0 until layout.lineCount - 1).all { line: Int -> text[layout.getLineEnd(line) - 1].isWhitespace() }

private fun linesOf(text: String, layout: TextLayoutResult): List<String> =
    (0 until layout.lineCount).map { line: Int -> text.substring(layout.getLineStart(line), layout.getLineEnd(line)) }
