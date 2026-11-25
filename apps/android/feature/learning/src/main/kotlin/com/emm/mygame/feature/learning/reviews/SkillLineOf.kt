package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.RaisedSkill
import kotlin.math.floor

internal fun skillLineOf(skill: RaisedSkill): ReviewUiState.SkillLine = ReviewUiState.SkillLine(
    resource = skill.resource,
    level = skill.level,
    ratePercent = skill.ratePercent,
    rates = ratesOf(skill.ratePerHourBefore, skill.ratePerHourAfter),
    words = skill.words,
)

private fun ratesOf(before: Double?, after: Double?): ReviewUiState.SkillRates? {
    if (before == null || after == null) return null
    return ReviewUiState.SkillRates(before = floor(before).toLong(), after = floor(after).toLong())
}
