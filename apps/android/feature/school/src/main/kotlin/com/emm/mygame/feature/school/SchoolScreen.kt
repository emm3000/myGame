package com.emm.mygame.feature.school

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
fun SchoolScreen(state: SchoolUiState, onIntent: (SchoolIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        when (state) {
            SchoolUiState.Loading -> {
                SchoolTitle()
                MyGameText(
                    text = stringResource(R.string.school_loading),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
            SchoolUiState.Failed -> {
                SchoolTitle()
                MyGameErrorBanner(
                    message = stringResource(R.string.school_refusal_unexpected),
                    actionLabel = stringResource(R.string.school_try_again),
                    onAction = { onIntent(SchoolIntent.RetryTapped) },
                )
            }
            is SchoolUiState.Content -> {
                SchoolTitle(level = state.schoolLevel)
                LearningSection(learning = state.learning)
                LessonSlotSection(slot = state.slot, stop = state.stop, onIntent = onIntent)
                LessonsSection(content = state, onIntent = onIntent)
                SkillsSection(content = state)
            }
        }
    }
}

@Composable
private fun SchoolTitle(modifier: Modifier = Modifier, level: Int? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.school_title),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        if (level != null) {
            MyGameText(
                text = icuStringResource(R.string.school_level, "level" to level.toString()),
                style = MyGameTypography.label,
                color = MyGameTheme.colors.inkMuted,
            )
        }
    }
}

@Composable
private fun LearningSection(learning: SchoolUiState.LearningLine, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = icuStringResource(
                    R.string.school_learning,
                    "inLearning" to learning.inLearning.toString(),
                    "cap" to learning.cap.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTrack(filled = learning.inLearning.toFloat() / learning.cap, color = MyGameTheme.colors.action)
            learning.wordsPastCap?.let { count: Int ->
                MyGameText(
                    text = icuStringResource(R.string.school_learning_full, "count" to count),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.miss,
                )
            }
        }
    }
}

@Composable
private fun SkillsSection(content: SchoolUiState.Content, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.school_skills))
        MyGameCard {
            if (content.skills.isEmpty()) {
                MyGameText(
                    text = stringResource(R.string.school_skills_none),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                    modifier = Modifier.padding(vertical = MyGameSpacing.step4),
                )
            }
            content.skills.forEach { skill: SchoolUiState.SkillLine -> SkillItem(skill = skill) }
        }
    }
}

@Composable
private fun SkillItem(skill: SchoolUiState.SkillLine, modifier: Modifier = Modifier) {
    val resource: String = stringResource(resourceNameOf(skill.resource))
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = icuStringResource(
                R.string.school_skill_name,
                "resource" to resource,
                "level" to skill.level.toString(),
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = icuStringResource(
                R.string.school_skill_rate,
                "percent" to skill.ratePercent.toString(),
                "resource" to resource,
            ),
            style = MyGameTypography.numeral,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}
