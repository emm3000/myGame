package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.emm.mygame.core.designsystem.frame.MyGameSunkenCard
import com.emm.mygame.core.designsystem.text.MyGameSectionTitle
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

internal const val SKILLS_CARD: String = "skills_card"

@Composable
internal fun SkillsSection(content: SchoolUiState.Content, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(label = copy.chrome(R.string.school_skills))
        MyGameSunkenCard(modifier = Modifier.testTag(SKILLS_CARD)) {
            if (content.skills.isEmpty()) {
                MyGameText(
                    label = copy.chrome(R.string.school_skills_none),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
            content.skills.forEach { skill: SchoolUiState.SkillLine -> SkillItem(skill = skill) }
        }
    }
}

@Composable
private fun SkillItem(skill: SchoolUiState.SkillLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = copy.chrome {
                text(
                    R.string.school_skill_name,
                    "resource" to text(resourceNameOf(skill.resource)),
                    "level" to skill.level.toString(),
                )
            },
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome {
                text(
                    R.string.school_skill_rate,
                    "percent" to skill.ratePercent.toString(),
                    "resource" to text(resourceNameOf(skill.resource)),
                )
            },
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}
