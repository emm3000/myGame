package com.emm.mygame.core.designsystem.frame

import com.emm.mygame.core.designsystem.text.MyGameWordSupport

private val chunkStarts: Regex = Regex("""(?<=\s)(?=[^\s\p{P}]|_)""")

internal data class FrameChunk(val runs: List<FrameRun>)

private data class FrameSlice(val startsChunk: Boolean, val run: FrameRun)

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
