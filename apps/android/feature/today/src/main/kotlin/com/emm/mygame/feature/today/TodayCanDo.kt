package com.emm.mygame.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.frame.MyGameSunkenCard
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameSectionTitle
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TodayCanDo(
    content: TodayUiState.Content,
    onIntent: (TodayIntent) -> Unit,
    placement: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        if (content.canDo.isNotEmpty()) MyGameSectionTitle(label = copy.canDoTitleOf(content.lesson != null))
        content.canDo.forEach { row: TodayUiState.CanDo ->
            NextLevelRow(
                building = row.building,
                next = row.next,
                reason = null,
                build = content.build,
                onIntent = onIntent,
            )
        }
        placement()
    }
}

@Composable
internal fun TodayLocked(
    content: TodayUiState.Content,
    onIntent: (TodayIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameSectionTitle(label = fixedLabel(copy.fixedCopy(R.string.today_locked)))
        content.locked.forEach { row: TodayUiState.Locked ->
            NextLevelRow(
                building = row.building,
                next = row.next,
                reason = copy.blockLineOf(row.block),
                build = content.build,
                onIntent = onIntent,
            )
        }
    }
}

@Composable
private fun NextLevelRow(
    building: TownBuildingKind,
    next: NextLevelLine,
    reason: MyGameLabel?,
    build: StartStatus,
    onIntent: (TodayIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameSunkenCard(modifier = modifier) {
        MyGameText(
            label = copy.nextLevelTitleOf(building, next),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameGoOutlinedButton(
            label = copy.buildLabelOf(next),
            isBusy = build == StartStatus.Waiting(building),
            busyDescription = copy.chrome(R.string.today_waiting),
            onClick = { onIntent(TodayIntent.BuildTapped(building)) },
            blockedReason = reason,
        )
        copy.buildRefusalOf(build, building)?.let { refusal: String -> MyGameInlineAlert(message = refusal) }
    }
}
