package com.emm.mygame.feature.report

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun ReportRows(
    isReminderOffered: Boolean,
    onNewsOpen: () -> Unit,
    onSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameNavRow(title = chromeResource(R.string.report_news_all), onClick = onNewsOpen)
        if (isReminderOffered) {
            MyGameNavRow(title = fixedCopyLabel(R.string.report_reminder_offer), onClick = onSettingsOpen)
        }
        MyGameNavRow(title = fixedCopyLabel(R.string.report_settings), onClick = onSettingsOpen)
    }
}

@Composable
private fun fixedCopyLabel(@StringRes id: Int): MyGameLabel =
    MyGameLabel(text = fixedCopyResource(id), translation = null)
