package com.emm.mygame.core.designsystem

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.dp

private val chunkStarts: Regex = Regex("""(?<=\s)(?=[^\s\p{P}]|_)""")

internal sealed interface FrameRun {
    data class Plain(val text: String) : FrameRun

    data class Word(val pieceIndex: Int, val text: String) : FrameRun

    data class Beside(val support: MyGameWordSupport, val closing: String) : FrameRun
}

internal data class FrameChunk(val runs: List<FrameRun>)

private data class FrameSlice(val startsChunk: Boolean, val run: FrameRun)

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
    ground: MyGameFrameGround = MyGameFrameGround.Block,
) {
    val ink: TextStyle = style.copy(color = ground.ink())
    FlowRow(
        itemVerticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) {
                text = spokenFrameOf(frame)
                frameStyle = ink
            },
    ) {
        frameChunksOf(frame).forEach { chunk: FrameChunk ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                chunk.runs.forEach { run: FrameRun ->
                    FrameRunText(run = run, openPiece = openPiece, ink = ink, ground = ground, onPieceTap = onPieceTap)
                }
            }
        }
    }
}

internal fun frameChunksOf(frame: MyGameFrame): List<FrameChunk> {
    val text: String = frame.pieces.joinToString(separator = "", transform = MyGameFramePiece::text)
    val starts: Set<Int> = chunkStarts.findAll(text)
        .map { start: MatchResult -> start.range.first }
        .toSet()
    val offsets: List<Int> = frame.pieces.runningFold(0) { offset: Int, piece: MyGameFramePiece ->
        offset + piece.text.length
    }
    val chunks: MutableList<MutableList<FrameRun>> = mutableListOf()
    frame.pieces
        .flatMapIndexed { index: Int, piece: MyGameFramePiece -> slicesOf(piece, index, offsets[index], starts) }
        .forEach { slice: FrameSlice ->
            if (slice.startsChunk || chunks.isEmpty()) chunks.add(mutableListOf())
            chunks.last().addRun(slice.run)
        }
    return chunks.map { runs: List<FrameRun> -> FrameChunk(runs.toList()) }
}

private fun MutableList<FrameRun>.addRun(run: FrameRun) {
    val beside: FrameRun.Beside? = lastOrNull() as? FrameRun.Beside
    if (beside == null || run !is FrameRun.Plain) {
        add(run)
        return
    }
    set(lastIndex, beside.copy(closing = beside.closing + run.text))
}

private fun slicesOf(piece: MyGameFramePiece, index: Int, offset: Int, starts: Set<Int>): List<FrameSlice> {
    val support: MyGameWordSupport? = piece.support
    if (support?.isOnTap == true) return listOf(FrameSlice(offset in starts, FrameRun.Word(index, piece.text)))
    val cuts: List<Int> = piece.text.indices.filter { at: Int -> at == 0 || offset + at in starts }
    val plains: List<FrameSlice> = (cuts + piece.text.length).zipWithNext { from: Int, until: Int ->
        FrameSlice(offset + from in starts, FrameRun.Plain(piece.text.substring(from, until)))
    }
    if (support == null) return plains
    return plains + FrameSlice(startsChunk = true, run = FrameRun.Beside(support, closing = ""))
}

@Composable
private fun FrameRunText(
    run: FrameRun,
    openPiece: Int?,
    ink: TextStyle,
    ground: MyGameFrameGround,
    onPieceTap: (Int) -> Unit,
) {
    when (run) {
        is FrameRun.Plain -> PlainText(text = run.text, ink = ink)
        is FrameRun.Word -> WordOnTap(
            text = run.text,
            isOpen = run.pieceIndex == openPiece,
            ink = ink,
            onTap = { onPieceTap(run.pieceIndex) },
        )
        is FrameRun.Beside -> BesideSupport(beside = run, ink = ink, muted = ground.inkMuted())
    }
}

@Composable
private fun PlainText(text: String, ink: TextStyle) {
    MyGameText(
        text = text,
        style = ink,
        color = ink.color,
        modifier = Modifier.clearAndSetSemantics { },
    )
}

@Composable
private fun BesideSupport(beside: FrameRun.Beside, ink: TextStyle, muted: Color) {
    MyGameText(
        text = buildAnnotatedString {
            append(beside.support.spokenText())
            withStyle(ink.toSpanStyle()) { append(beside.closing) }
        },
        style = MyGameTypography.gloss,
        color = muted,
        modifier = Modifier
            .padding(start = MyGameSpacing.step1)
            .clearAndSetSemantics { testTag = BESIDE_SUPPORT },
    )
}

@Composable
private fun WordOnTap(text: String, isOpen: Boolean, ink: TextStyle, onTap: () -> Unit) {
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    val ringColor: Color = ink.color
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .defaultMinSize(minHeight = MyGameSizes.control)
            .focusRingAround(
                isFocused = isFocused,
                color = ringColor,
                horizontalReach = MyGameStrokeWidths.focus,
                verticalReach = -MyGameStrokeWidths.focus / 2,
                radius = MyGameRadii.sm,
            )
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
