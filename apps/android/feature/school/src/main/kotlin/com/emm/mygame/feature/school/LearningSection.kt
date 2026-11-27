package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSunkenCard
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

internal const val LEARNING_CARD: String = "learning_card"

@Composable
internal fun LearningSection(learning: SchoolUiState.LearningLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameSunkenCard(modifier = modifier.testTag(LEARNING_CARD)) {
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            MyGameText(
                label = copy.chrome(
                    R.string.school_learning,
                    "inLearning" to learning.inLearning.toString(),
                    "cap" to learning.cap.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTrack(filled = learning.inLearning.toFloat() / learning.cap, color = MyGameTheme.colors.action)
            learning.pastCapWords?.let { words: Int ->
                MyGameText(
                    label = copy.pastCapLabelOf(words, learning.opening),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.warningInk,
                )
            }
        }
    }
}
