package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun SkillsSection(content: SchoolUiState.Content, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(label = copy.chrome(R.string.school_skills))
        MyGameCard {
            if (content.skills.isEmpty()) {
                MyGameText(
                    label = copy.chrome(R.string.school_skills_none),
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
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
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
