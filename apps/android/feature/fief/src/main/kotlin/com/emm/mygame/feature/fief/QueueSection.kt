package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun QueueSection(content: FiefUiState.Content, onIntent: (FiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.queue_title))
        content.queue.forEach { waiting: FiefUiState.WaitingLine ->
            WaitingItem(waiting = waiting, cancel = content.cancel, onIntent = onIntent)
        }
    }
}

@Composable
internal fun waitingSummaryOf(content: FiefUiState.Content): String? {
    val last: FiefUiState.WaitingLine = content.queue.lastOrNull() ?: return null
    return icuStringResource(
        R.string.queue_summary,
        "count" to content.queue.size.toString(),
        "finish" to finishLabelOf(last.remaining, last.finishesAt),
    )
}

@Composable
private fun WaitingItem(
    waiting: FiefUiState.WaitingLine,
    cancel: FiefUiState.CancelStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        ) {
            MyGameText(
                text = stringResource(buildingNameOf(waiting.building)),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = icuStringResource(R.string.slot_level, "level" to waiting.targetLevel.toString()),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            MyGameText(
                text = icuStringResource(
                    R.string.queue_finish,
                    "finish" to finishLabelOf(waiting.remaining, waiting.finishesAt),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            CancelControl(
                target = FiefUiState.UpgradeTarget(waiting.building, waiting.targetLevel),
                cancel = cancel,
                onIntent = onIntent,
            )
        }
    }
}
