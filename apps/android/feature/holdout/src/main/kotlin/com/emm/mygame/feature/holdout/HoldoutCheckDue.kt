package com.emm.mygame.feature.holdout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun HoldoutCheckDue(
    due: HoldoutCheckUiState.Due,
    onIntent: (HoldoutCheckIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val waiting: HoldoutCheckAction? = (due.request as? HoldoutCheckRequest.Waiting)?.action
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = fixedCopyResource(
                R.string.holdout_due_line,
                "band" to due.band.number.toString(),
                "week" to due.week.number.toString(),
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = fixedCopyResource(R.string.holdout_skip_line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        if (due.request.isSkipVerdict) HoldoutCheckRequestLine(request = due.request)
        MyGameOutlinedButton(
            label = fixedCopyResource(R.string.holdout_skip),
            isBusy = waiting == HoldoutCheckAction.Skip,
            busyDescription = fixedCopyResource(R.string.holdout_sending),
            onClick = { onIntent(HoldoutCheckIntent.SkipTapped) },
        )
    }
}
