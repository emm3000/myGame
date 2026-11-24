package com.emm.mygame.feature.school.text

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSupportLine
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.englishTextOf
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.joinsFrameTraversal
import com.emm.mygame.feature.school.R
import com.emm.mygame.feature.school.toMyGameFrame
import com.emm.mygame.feature.school.toMyGameSupport

@Composable
internal fun SchoolTextScreen(
    state: SchoolTextUiState,
    onIntent: (SchoolTextIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
    foldedDock: @Composable () -> Unit = {},
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .joinsFrameTraversal()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step8),
    ) {
        foldedDock()
        MyGameSkeleton(
            isLoading = state == SchoolTextUiState.Loading,
            loadingLabel = chromeResource(R.string.school_loading).spoken,
            blocks = schoolTextBlocks,
        ) {
            SchoolTextState(state = state, onIntent = onIntent, onSchoolOpen = onSchoolOpen)
        }
    }
}

@Composable
private fun SchoolTextState(
    state: SchoolTextUiState,
    onIntent: (SchoolTextIntent) -> Unit,
    onSchoolOpen: () -> Unit,
) {
    when (state) {
        SchoolTextUiState.Loading -> Unit
        SchoolTextUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.school_refusal_unexpected),
            actionLabel = chromeResource(R.string.school_try_again),
            onAction = { onIntent(SchoolTextIntent.RetryTapped) },
        )
        SchoolTextUiState.NotOpen -> {
            MyGameText(
                label = chromeResource(R.string.school_lesson_nothing_to_read),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            SchoolLink(onSchoolOpen = onSchoolOpen)
        }
        is SchoolTextUiState.Reading -> {
            TextReading(reading = state, onIntent = onIntent)
            SchoolLink(onSchoolOpen = onSchoolOpen)
        }
    }
}

private val schoolTextBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.placeCard),
)

@Composable
private fun TextReading(
    reading: SchoolTextUiState.Reading,
    onIntent: (SchoolTextIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = englishTextOf(reading.text.title),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameBlock(hue = MyGameBlockHue.Peach) {
            reading.text.sentences.indices.forEach { sentence: Int ->
                Sentence(sentence = sentence, reading = reading, onIntent = onIntent)
            }
        }
    }
}

@Composable
private fun Sentence(
    sentence: Int,
    reading: SchoolTextUiState.Reading,
    onIntent: (SchoolTextIntent) -> Unit,
) {
    val tappedSpan: Int? = reading.tapped?.takeIf { at: SchoolTextUiState.SpanAt -> at.sentence == sentence }?.span
    MyGameFrameText(
        frame = reading.text.sentences[sentence].toMyGameFrame(),
        openPiece = tappedSpan,
        style = MyGameTypography.reading,
        onPieceTap = { span: Int -> onIntent(SchoolTextIntent.WordTapped(SchoolTextUiState.SpanAt(sentence, span))) },
    )
    if (tappedSpan == null) return
    reading.openSupport?.let { support: WordSupport -> MyGameSupportLine(support = support.toMyGameSupport()) }
}

@Composable
private fun SchoolLink(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    MyGameNavRow(
        title = chromeResource(R.string.school_go_to_school),
        onClick = onSchoolOpen,
        modifier = modifier,
    )
}
