package com.emm.mygame.feature.school.words

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.school.R

@Composable
internal fun NextStepLine(nextStep: NextStepCard, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.semantics(mergeDescendants = true) {},
    ) {
        MyGameMetaText(label = copy.chrome(R.string.school_next_title), color = MyGameTheme.colors.inkMuted)
        MyGameText(label = copy.stepOf(nextStep), style = MyGameTypography.heading, color = MyGameTheme.colors.ink)
    }
}

private fun PlayerCopy.stepOf(nextStep: NextStepCard): MyGameLabel {
    val action: NextStepCard.Action = nextStep.action
    return when (action) {
        is NextStepCard.Action.Study -> chrome(R.string.school_lesson_study, "number" to action.number.toString())
        is NextStepCard.Action.StudyReleased -> fixedLabel(fixedCopy(R.string.school_released_lesson_study))
        NextStepCard.Action.StartReviews -> chrome(R.string.school_start_reviews)
        is NextStepCard.Action.ReadWords -> chrome(R.string.school_lesson_read_words)
        is NextStepCard.Action.OpenHoldoutCheck ->
            fixedLabel(fixedCopy(R.string.school_next_holdout_check, "band" to action.band.number.toString()))
        NextStepCard.Action.GoToReport -> caughtUpOf(nextStep.line)
    }
}

private fun PlayerCopy.caughtUpOf(line: NextStepCard.Line): MyGameLabel {
    if (line !is NextStepCard.Line.LearningCap) return chrome(R.string.school_no_reviews_due)
    return chrome(R.string.school_learning, "inLearning" to line.inLearning.toString(), "cap" to line.cap.toString())
}
