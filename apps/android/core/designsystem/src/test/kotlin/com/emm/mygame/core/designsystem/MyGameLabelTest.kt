package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameLabelTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val startReviews: MyGameLabel = MyGameLabel(text = "Start reviews", translation = "Empezar a repasar")

    private val waiting: MyGameLabel = MyGameLabel(text = "Waiting", translation = null)

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `draws a translated ink pill as English over Spanish inside its action height`() {
        show { MyGameButton(label = startReviews, isBusy = false, busyDescription = waiting, onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot())
        composeRule.onNodeWithTag(INK_PILL).assertHeightIsAtLeast(MyGameSizes.action)
    }

    @Test
    fun `draws a translated outlined pill as English over Spanish inside its secondary height`() {
        show { MyGameOutlinedButton(label = startReviews, isBusy = false, busyDescription = waiting, onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithTag(OUTLINED_PILL).getUnclippedBoundsInRoot())
        composeRule.onNodeWithTag(OUTLINED_PILL).assertHeightIsAtLeast(MyGameSizes.secondary)
    }

    @Test
    fun `draws a translated text link as English over Spanish inside its control height`() {
        show { MyGameTextLink(label = startReviews, onClick = {}) }

        assertEnglishOverSpanish(within = composeRule.onNodeWithText("Start reviews").getUnclippedBoundsInRoot())
        composeRule.onNodeWithText("Start reviews").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    fun `draws a translated back link as English over Spanish inside its control height`() {
        show { MyGameBackLink(label = MyGameLabel("Town", "Pueblo"), isEnabled = true, onClick = {}) }

        val englishLine: DpRect = unmerged("Town")
        val spanishLine: DpRect = unmerged("Pueblo")
        assertTrue(englishLine.bottom <= spanishLine.top)
        composeRule.onNodeWithText("Town").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    fun `draws an untranslated label on one line`() {
        show {
            MyGameButton(
                label = MyGameLabel(text = "Start reviews", translation = null),
                isBusy = false,
                busyDescription = MyGameLabel(text = "Waiting", translation = null),
                onClick = {},
            )
        }

        composeRule.onAllNodesWithText("Start reviews", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onAllNodesWithText("Empezar a repasar", useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws a translated section title as English over Spanish`() {
        show { MyGameSectionTitle(label = startReviews) }

        assertTrue(unmerged("Start reviews").bottom <= unmerged("Empezar a repasar").top)
    }

    @Test
    fun `reads a translated section title as one heading in both languages`() {
        show { MyGameSectionTitle(label = startReviews) }

        composeRule.onNode(isHeading()).assertTextEquals("Start reviews", "Empezar a repasar")
    }

    @Test
    fun `draws an untranslated section title as one heading line`() {
        show { MyGameSectionTitle(text = "Start reviews") }

        composeRule.onAllNodesWithText("Start reviews", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onNode(isHeading() and hasText("Start reviews")).assertExists()
    }

    @Test
    fun `draws a section title in heading on the ink`() {
        var ink: Color = Color.Unspecified
        show {
            ink = MyGameTheme.colors.ink
            MyGameSectionTitle(text = "Start reviews")
        }

        val drawn: TextStyle = styleOf("Start reviews")
        assertEquals(MyGameTypography.heading.fontSize, drawn.fontSize)
        assertEquals(MyGameTypography.heading.fontWeight, drawn.fontWeight)
        assertEquals(ink, drawn.color)
    }

    @Test
    fun `reads a translated field's label once, English then Spanish`() {
        show { FieldLabelled(label = MyGameLabel(text = "Your answer", translation = "Tu respuesta")) }

        composeRule.onAllNodesWithContentDescription("Your answer\nTu respuesta").assertCountEquals(1)
        composeRule.onAllNodesWithText("Your answer").assertCountEquals(0)
        composeRule.onAllNodesWithText("Tu respuesta").assertCountEquals(0)
    }

    @Test
    fun `keeps an untranslated field's label as its drawn line and its description`() {
        show { FieldLabelled(label = MyGameLabel(text = "Your answer", translation = null)) }

        composeRule.onAllNodesWithText("Your answer", useUnmergedTree = true).assertCountEquals(1)
        composeRule.onAllNodesWithContentDescription("Your answer").assertCountEquals(1)
    }

    @Test
    fun `draws a translated supporting line as English over its Spanish translation line`() {
        show { FieldSupported(supportingText = MyGameLabel(text = "3 at home", translation = "3 en casa")) }

        assertTrue(unmerged("3 at home").bottom <= unmerged("3 en casa").top)
        assertEquals(MyGameTypography.body.fontSize, styleOf("3 at home").fontSize)
        assertEquals(MyGameTypography.caption.fontSize, styleOf("3 en casa").fontSize)
    }

    @Test
    fun `draws a translated error message as English over its Spanish translation line`() {
        show {
            MyGameErrorBanner(
                message = MyGameLabel(text = "We could not read it.", translation = "No pudimos leerlo."),
                actionLabel = MyGameLabel(text = "Try again", translation = "Volver a intentarlo"),
                onAction = {},
            )
        }

        assertTrue(unmerged("We could not read it.").bottom <= unmerged("No pudimos leerlo.").top)
        assertEquals(MyGameTypography.body.fontSize, styleOf("We could not read it.").fontSize)
        assertEquals(MyGameTypography.caption.fontSize, styleOf("No pudimos leerlo.").fontSize)
    }

    @Test
    fun `announces a translated error message as one polite region in both languages`() {
        show {
            MyGameErrorBanner(
                message = MyGameLabel(text = "We could not read it.", translation = "No pudimos leerlo."),
                actionLabel = MyGameLabel(text = "Try again", translation = "Volver a intentarlo"),
                onAction = {},
            )
        }

        composeRule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion))
            .assertTextEquals("We could not read it.", "No pudimos leerlo.")
    }

    @Test
    fun `centers both lines of a translated styled label as the plain label does`() {
        show { CenteredStyledReport() }

        assertEquals(reportWidth.value / 2, centerOf(unmerged("Report")), tolerance.value)
        assertEquals(reportWidth.value / 2, centerOf(unmerged("Informe")), tolerance.value)
    }

    @Test
    fun `draws a translated styled label's translation in caption as the plain label does`() {
        show { CenteredStyledReport() }

        assertEquals(MyGameTypography.display.fontSize, styleOf("Report").fontSize)
        assertEquals(MyGameTypography.caption.fontSize, styleOf("Informe").fontSize)
    }

    @Test
    fun `keeps the styled spans on both lines of a translated label`() {
        show { CenteredStyledReport() }

        assertEquals(listOf(bold), spansOf("Report"))
        assertEquals(listOf(bold), spansOf("Informe"))
    }

    private fun spansOf(text: String): List<SpanStyle> =
        layoutOf(text).layoutInput.text.spanStyles.map { span: AnnotatedString.Range<SpanStyle> -> span.item }

    private fun layoutOf(text: String): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single()
    }

    private fun styleOf(text: String): TextStyle = layoutOf(text).layoutInput.style

    private fun assertEnglishOverSpanish(within: DpRect) {
        val englishLine: DpRect = unmerged("Start reviews")
        val spanishLine: DpRect = unmerged("Empezar a repasar")
        assertTrue(englishLine.bottom <= spanishLine.top)
        assertTrue(within.contains(englishLine) && within.contains(spanishLine))
    }

    private fun unmerged(text: String): DpRect =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getUnclippedBoundsInRoot()
}

private val reportWidth: Dp = 320.dp

private val bold: SpanStyle = SpanStyle(fontWeight = FontWeight.Bold)

private fun boldLineOf(line: String): AnnotatedString =
    AnnotatedString(line, spanStyles = listOf(AnnotatedString.Range(bold, start = 0, end = line.length)))

@Composable
private fun CenteredStyledReport() {
    Box(modifier = Modifier.width(reportWidth)) {
        MyGameText(
            label = MyGameLabel(text = "Report", translation = "Informe"),
            style = MyGameTypography.display.copy(textAlign = TextAlign.Center),
            color = MyGameTheme.colors.ink,
            styledLineOf = ::boldLineOf,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun FieldLabelled(label: MyGameLabel) {
    MyGameTextField(
        value = "",
        label = label,
        isSecret = false,
        isReadOnly = false,
        keyboardOptions = KeyboardOptions.Default,
        onValueChange = {},
    )
}

@Composable
private fun FieldSupported(supportingText: MyGameLabel) {
    MyGameTextField(
        value = "",
        label = MyGameLabel(text = "Workers", translation = "Trabajadores"),
        isSecret = false,
        isReadOnly = false,
        keyboardOptions = KeyboardOptions.Default,
        onValueChange = {},
        supportingText = supportingText,
    )
}

private fun DpRect.contains(inner: DpRect): Boolean =
    inner.left >= left - tolerance && inner.right <= right + tolerance &&
        inner.top >= top - tolerance && inner.bottom <= bottom + tolerance

private val tolerance: Dp = Dp(0.5f)

private fun centerOf(line: DpRect): Float = (line.left.value + line.right.value) / 2
