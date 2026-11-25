package com.emm.mygame

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.designsystem.MyGameRing
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.ui.chromeResource

@Composable
internal fun RetainedWordsRing(
    towns: TownReader,
    doesScreenReadTown: Boolean,
    modifier: Modifier = Modifier,
    viewModel: RetainedWordsViewModel = viewModel { RetainedWordsViewModel(towns, doesScreenReadTown) },
) {
    val state: RetainedWordsUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(RetainedWordsIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(RetainedWordsIntent.ScreenHidden) }
    }
    when (val ring: RetainedWordsUiState = state) {
        RetainedWordsUiState.Hidden -> Unit
        is RetainedWordsUiState.Shown -> MyGameRing(
            count = ring.count,
            total = ring.total,
            countBefore = ring.countBefore,
            label = chromeResource(
                R.string.shell_retained_words,
                "count" to ring.count.toString(),
                "total" to ring.total,
            ),
            modifier = modifier,
        )
    }
}
