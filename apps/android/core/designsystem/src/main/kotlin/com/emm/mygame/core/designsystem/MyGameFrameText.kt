package com.emm.mygame.core.designsystem

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.dp

private val wordChunks: Regex = Regex("""\s*\S+\s*|\s+""")

val FRAME_STYLE: SemanticsPropertyKey<TextStyle> = SemanticsPropertyKey("FRAME_STYLE")

const val BESIDE_SUPPORT: String = "beside_support"

private var SemanticsPropertyReceiver.frameStyle: TextStyle by FRAME_STYLE

@Composable
fun MyGameFrameText(
    frame: MyGameFrame,
    openPiece: Int?,
    style: TextStyle,
    onPieceTap: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val ink: TextStyle = style.copy(color = MyGameTheme.colors.onBlock)
    FlowRow(
        itemVerticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                text = spokenFrameOf(frame)
                frameStyle = ink
            },
    ) {
        frame.pieces.forEachIndexed { index: Int, piece: MyGameFramePiece ->
            FramePiece(
                piece = piece,
                isOpen = index == openPiece,
                ink = ink,
                onTap = { onPieceTap(index) },
            )
        }
    }
}

@Composable
private fun FramePiece(piece: MyGameFramePiece, isOpen: Boolean, ink: TextStyle, onTap: () -> Unit) {
    val support: MyGameWordSupport? = piece.support
    when {
        support == null -> PlainChunks(text = piece.text, ink = ink)
        support.isOnTap -> WordOnTap(text = piece.text, isOpen = isOpen, ink = ink, onTap = onTap)
        else -> {
            PlainChunks(text = piece.text, ink = ink)
            BesideSupport(support = support)
        }
    }
}

@Composable
private fun PlainChunks(text: String, ink: TextStyle) {
    wordChunks.findAll(text).forEach { chunk: MatchResult ->
        MyGameText(
            text = chunk.value,
            style = ink,
            color = ink.color,
            modifier = Modifier.clearAndSetSemantics { },
        )
    }
}

@Composable
private fun BesideSupport(support: MyGameWordSupport) {
    MyGameText(
        text = support.spokenText(),
        style = MyGameTypography.gloss,
        color = MyGameTheme.colors.onBlockMuted,
        modifier = Modifier
            .padding(start = MyGameSpacing.step1)
            .clearAndSetSemantics { testTag = BESIDE_SUPPORT },
    )
}

@Composable
private fun WordOnTap(text: String, isOpen: Boolean, ink: TextStyle, onTap: () -> Unit) {
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.sm)
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .defaultMinSize(minWidth = MyGameSizes.control, minHeight = MyGameSizes.control)
            .then(if (isFocused) focusRing(shape) else Modifier)
            .clickable(
                interactionSource = interactions,
                indication = LocalIndication.current,
                role = Role.Button,
                onClick = onTap,
            )
            .semantics { selected = isOpen },
    ) {
        MyGameText(
            text = text,
            style = ink.copy(textDecoration = TextDecoration.Underline),
            color = ink.color,
        )
    }
}

@Composable
private fun focusRing(shape: RoundedCornerShape): Modifier =
    Modifier.border(width = MyGameStrokeWidths.focus, color = MyGameTheme.colors.onBlock, shape = shape)

private fun spokenFrameOf(frame: MyGameFrame): AnnotatedString = buildAnnotatedString {
    frame.pieces.forEach { piece: MyGameFramePiece ->
        append(piece.text)
        val support: MyGameWordSupport = piece.support?.takeUnless(MyGameWordSupport::isOnTap) ?: return@forEach
        append(" ")
        appendSupport(support)
    }
}

private val previewBeside: MyGameWordSupport = MyGameWordSupport(isOnTap = false, text = "caminar", languageTag = "es")

private val previewOnTap: MyGameWordSupport = MyGameWordSupport(isOnTap = true, text = "caminar", languageTag = "es")

private val previewDefinition: MyGameWordSupport =
    MyGameWordSupport(isOnTap = true, text = "a building where children learn", languageTag = "en")

private data class FrameState(val frame: MyGameFrame, val openPiece: Int?)

private class FrameStates : PreviewParameterProvider<FrameState> {

    override val values: Sequence<FrameState> = sequenceOf(
        FrameState(plainPreviewFrame, null),
        FrameState(walkFrameOf(previewBeside), null),
        FrameState(walkFrameOf(previewOnTap), null),
        FrameState(walkFrameOf(previewOnTap), 1),
        FrameState(longPreviewFrame, 7),
    )
}

private val plainPreviewFrame: MyGameFrame =
    MyGameFrame(listOf(MyGameFramePiece(text = "Things like this go on in many towns.", support = null)))

private val longPreviewFrame: MyGameFrame = MyGameFrame(
    listOf(
        MyGameFramePiece(text = "We ", support = null),
        MyGameFramePiece(text = "go", support = previewOnTap),
        MyGameFramePiece(text = " to ", support = null),
        MyGameFramePiece(text = "work", support = previewOnTap),
        MyGameFramePiece(text = " in a ", support = null),
        MyGameFramePiece(text = "truck", support = previewBeside),
        MyGameFramePiece(text = " at the ", support = null),
        MyGameFramePiece(text = "school", support = previewDefinition),
        MyGameFramePiece(text = " every day.", support = null),
    ),
)

private fun walkFrameOf(support: MyGameWordSupport): MyGameFrame = MyGameFrame(
    listOf(
        MyGameFramePiece(text = "The kids ", support = null),
        MyGameFramePiece(text = "walk", support = support),
        MyGameFramePiece(text = " to school.", support = null),
    ),
)

@PreviewMyGame
@Composable
private fun MyGameFrameTextPreview(@PreviewParameter(FrameStates::class) state: FrameState) {
    MyGamePreviewSurface {
        MyGameBlock(hue = MyGameBlockHue.entries.first(), modifier = Modifier.width(360.dp)) {
            MyGameFrameText(
                frame = state.frame,
                openPiece = state.openPiece,
                style = MyGameTypography.reading,
                onPieceTap = {},
            )
            state.frame.openedSupportOf(state.openPiece)?.let { support: MyGameWordSupport ->
                MyGameSupportLine(support = support)
            }
        }
    }
}
