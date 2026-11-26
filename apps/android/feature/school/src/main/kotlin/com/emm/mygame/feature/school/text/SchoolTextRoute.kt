package com.emm.mygame.feature.school.text

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownTextRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
fun SchoolTextRoute(
    text: TextId,
    texts: TownTextRepository,
    onNoTown: () -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SchoolTextViewModel = viewModel { SchoolTextViewModel(text, texts) },
) {
    val state: SchoolTextUiState by viewModel.state.collectAsStateWithLifecycle()
    val currentOnNoTown: () -> Unit by rememberUpdatedState(onNoTown)
    LaunchedEffect(viewModel) {
        withContext(Dispatchers.Main.immediate) {
            viewModel.effects.collect { effect: SchoolTextEffect ->
                when (effect) {
                    SchoolTextEffect.NoTown -> currentOnNoTown()
                }
            }
        }
    }
    SchoolTextScreen(
        state = state,
        onIntent = viewModel::onIntent,
        onSchoolOpen = onSchoolOpen,
        modifier = modifier,
    )
}
