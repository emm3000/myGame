package com.emm.mygame.feature.review

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock

@Composable
fun ReviewRoute(
    learning: LearningRepository,
    towns: TownRepository,
    clock: Clock,
    onLessonOpen: (LessonId) -> Unit,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: ReviewViewModel = viewModel { ReviewViewModel(learning, towns, clock) },
) {
    val state: ReviewUiState by viewModel.state.collectAsStateWithLifecycle()
    ReviewScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onLessonOpen = onLessonOpen,
        onTownOpen = onTownOpen,
        modifier = modifier,
    )
}
