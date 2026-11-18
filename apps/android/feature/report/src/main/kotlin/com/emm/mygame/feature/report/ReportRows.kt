package com.emm.mygame.feature.report

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextLink
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
        ReportRow(label = chromeResource(R.string.report_news_all), onClick = onNewsOpen)
        if (isReminderOffered) {
            ReportRow(label = fixedCopyLabel(R.string.report_reminder_offer), onClick = onSettingsOpen)
        }
        ReportRow(label = fixedCopyLabel(R.string.report_settings), onClick = onSettingsOpen)
    }
}

@Composable
private fun ReportRow(label: MyGameLabel, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameTextLink(
            label = label,
            onClick = onClick,
            modifier = Modifier.fillMaxWidth().padding(vertical = MyGameSpacing.step2),
        )
    }
}

@Composable
private fun fixedCopyLabel(@StringRes id: Int): MyGameLabel =
    MyGameLabel(text = fixedCopyResource(id), translation = null)
