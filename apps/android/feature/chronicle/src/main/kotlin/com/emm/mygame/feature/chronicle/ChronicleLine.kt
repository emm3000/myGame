package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.ChronicleEvent
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun ChronicleLine(line: ChronicleInstant, event: ChronicleEvent, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    val amounts: String? = resources.amountsOf(event)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) { }
            .padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(text = instantLabelOf(line), style = MyGameTypography.label, color = MyGameTheme.colors.inkMuted)
        MyGameText(text = resources.sentenceOf(event), style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        if (amounts != null) {
            MyGameText(text = amounts, style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        }
    }
}

private fun Resources.sentenceOf(event: ChronicleEvent): AnnotatedString {
    val heading: String = headingOf(event)
    val sentence: String = getString(R.string.chronicle_line, heading, subjectOf(event))
    return buildAnnotatedString {
        append(sentence)
        addStyle(SpanStyle(fontWeight = FontWeight.Bold), start = 0, end = heading.length)
    }
}

@Composable
private fun instantLabelOf(line: ChronicleInstant): String {
    val time: String = line.at.format(clockFormat)
    return when (line.day) {
        ChronicleInstant.Day.Today -> stringResource(R.string.chronicle_today, time)
        ChronicleInstant.Day.ThisYear -> stringResource(R.string.chronicle_day, line.at.format(dayFormat), time)
        ChronicleInstant.Day.EarlierYear ->
            stringResource(R.string.chronicle_day_of_year, line.at.format(dayFormat), line.at.year, time)
    }
}

private val clockFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

private val dayFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es"))
