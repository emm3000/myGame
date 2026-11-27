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
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.englishTextOf
import com.emm.mygame.core.ui.ReadingBlock
import com.emm.mygame.core.ui.ReadingSentences
import com.emm.mygame.core.ui.ReadingSpan
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.school.R

@Composable
internal fun SchoolTextScreen(
    state: SchoolTextUiState,
    onIntent: (SchoolTextIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step8),
    ) {
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
            LessonsLink(onSchoolOpen = onSchoolOpen)
        }
        is SchoolTextUiState.Reading -> {
            TextReading(reading = state, onIntent = onIntent)
            LessonsLink(onSchoolOpen = onSchoolOpen)
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
        ReadingBlock(
            sentences = ReadingSentences(reading.text.sentences),
            tapped = reading.tapped,
            onSpanTap = { at: ReadingSpan -> onIntent(SchoolTextIntent.WordTapped(at)) },
        )
    }
}

@Composable
private fun LessonsLink(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    MyGameNavRow(
        title = chromeResource(R.string.school_go_to_lessons),
        onClick = onSchoolOpen,
        modifier = modifier,
    )
}
