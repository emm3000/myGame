package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun MyGamePlacePage(
    art: MyGameArt,
    name: MyGameLabel,
    level: MyGameLabel,
    modifier: Modifier = Modifier,
    words: MyGamePlaceWords? = null,
    header: @Composable ColumnScope.() -> Unit = {},
    work: @Composable ColumnScope.() -> Unit = {},
) {
    BoxWithConstraints(modifier = modifier) {
        val viewportHeight: Int = constraints.maxHeight
        Layout(
            contents = listOf(
                { Column(content = header) },
                { PageArt(art = art) },
                { PageText(name = name, level = level, words = words, work = work) },
            ),
            modifier = Modifier.verticalScroll(rememberScrollState()),
        ) { parts: List<List<Measurable>>, inner: Constraints ->
            placePage(parts = parts, constraints = inner, viewportHeight = viewportHeight)
        }
    }
}

@Composable
private fun PageArt(art: MyGameArt, modifier: Modifier = Modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier.fillMaxWidth()) {
        MyGamePlaceArt(art = art, risenFrom = null, modifier = Modifier.weight(1f))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(MyGameStrokeWidths.mark)
                .background(MyGameTheme.colors.ink),
        )
    }
}

@Composable
private fun PageText(
    name: MyGameLabel,
    level: MyGameLabel,
    words: MyGamePlaceWords?,
    work: @Composable ColumnScope.() -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            MyGameText(
                label = name,
                style = MyGameTypography.display,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(label = level, style = MyGameTypography.title, color = MyGameTheme.colors.ink)
        }
        if (words != null) {
            WordsLine(words = words)
        }
        work()
    }
}

@Composable
private fun WordsLine(words: MyGamePlaceWords, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(label = words.line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            repeat(words.needed) { index: Int ->
                MyGameTrack(
                    filled = if (index < words.held) 1f else 0f,
                    color = MyGameTheme.colors.ink,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

private fun MeasureScope.placePage(
    parts: List<List<Measurable>>,
    constraints: Constraints,
    viewportHeight: Int,
): MeasureResult {
    val (headerPart: List<Measurable>, artPart: List<Measurable>, textPart: List<Measurable>) = parts
    val loose: Constraints = constraints.copy(minWidth = 0, minHeight = 0, maxHeight = Constraints.Infinity)
    val gap: Int = MyGameSpacing.step4.roundToPx()
    val header: Placeable = headerPart.single().measure(loose)
    val text: Placeable = textPart.single().measure(loose)
    val headerGap: Int = if (header.height > 0) gap else 0
    val groundLine: Int = MyGameStrokeWidths.mark.roundToPx()
    val room: Int = viewportHeight - header.height - headerGap - gap - text.height - groundLine
    val artHeight: Int = room.coerceIn(MyGameSizes.thumbnail.roundToPx(), MyGameSizes.placeCard.roundToPx())
    val standing: Int = artHeight + groundLine
    val art: Placeable = artPart.single().measure(loose.copy(minHeight = standing, maxHeight = standing))
    val artTop: Int = header.height + headerGap
    val textTop: Int = artTop + art.height + gap
    return layout(constraints.maxWidth, textTop + text.height) {
        header.place(0, 0)
        art.place(0, artTop)
        text.place(0, textTop)
    }
}

private val previewPageHeight: Dp = 560.dp

private data class PlacePageState(
    val art: MyGameArt,
    val name: MyGameLabel,
    val level: MyGameLabel,
    val words: MyGamePlaceWords?,
    val work: MyGameLabel?,
)

private fun inEnglishOrSpanish(english: String, spanish: String, isSpanish: Boolean): MyGameLabel =
    if (isSpanish) MyGameLabel(text = spanish, translation = null) else MyGameLabel(text = english, translation = null)

private fun previewPagesIn(isSpanish: Boolean): List<PlacePageState> = listOf(
    PlacePageState(
        art = MyGameArt(drawable = R.drawable.designsystem_place_farm_2, tint = MyGameArtTint.None),
        name = inEnglishOrSpanish("Farm", "Granja", isSpanish),
        level = inEnglishOrSpanish("Level 2", "Nivel 2", isSpanish),
        words = null,
        work = inEnglishOrSpanish(
            english = "Building level 3: 12 min left",
            spanish = "Construyendo el nivel 3: quedan 12 min",
            isSpanish = isSpanish,
        ),
    ),
    PlacePageState(
        art = MyGameArt(drawable = R.drawable.designsystem_place_school_3, tint = MyGameArtTint.None),
        name = inEnglishOrSpanish("School", "Escuela", isSpanish),
        level = inEnglishOrSpanish("Level 3", "Nivel 3", isSpanish),
        words = MyGamePlaceWords(
            line = inEnglishOrSpanish(
                english = "Needs 5 learned words: 3 of 5",
                spanish = "Necesita 5 palabras aprendidas: 3 de 5",
                isSpanish = isSpanish,
            ),
            needed = 5,
            held = 3,
        ),
        work = null,
    ),
    PlacePageState(
        art = MyGameArt(drawable = R.drawable.designsystem_place_storage_10, tint = MyGameArtTint.None),
        name = inEnglishOrSpanish("Storage", "Almacén", isSpanish),
        level = inEnglishOrSpanish("Top level", "Nivel máximo", isSpanish),
        words = null,
        work = null,
    ),
)

private class PlacePageStates : PreviewParameterProvider<PlacePageState> {

    override val values: Sequence<PlacePageState> =
        (previewPagesIn(isSpanish = false) + previewPagesIn(isSpanish = true)).asSequence()
}

@PreviewMyGame
@Composable
private fun MyGamePlacePagePreview(@PreviewParameter(PlacePageStates::class) state: PlacePageState) {
    MyGamePreviewSurface {
        MyGamePlacePage(
            art = state.art,
            name = state.name,
            level = state.level,
            modifier = Modifier.height(previewPageHeight),
            words = state.words,
            header = {
                MyGameText(text = "Maple Hollow", style = MyGameTypography.title, color = MyGameTheme.colors.ink)
            },
            work = {
                state.work?.let { line: MyGameLabel ->
                    MyGameText(label = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
                }
            },
        )
    }
}
