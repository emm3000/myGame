package com.emm.mygame.feature.learning.reviews

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.school.WordStanding
import com.emm.mygame.core.model.town.school.schoolPathCountsOf

internal fun lessonPathOf(town: TownSnapshot): ReviewUiState.LessonPath? {
    val earned: Set<LessonId> = town.skills.map { skill: TownSnapshot.EarnedSkill -> skill.lesson }.toSet()
    val lesson: TownSnapshot.Lesson = town.lessons.firstOrNull { held: TownSnapshot.Lesson ->
        held.id !in earned && held.standings.any { standing: WordStanding -> standing != WordStanding.NotStarted }
    } ?: return null
    return ReviewUiState.LessonPath(number = town.numberOf(lesson.id), counts = schoolPathCountsOf(lesson.standings))
}
