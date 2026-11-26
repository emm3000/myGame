package com.emm.mygame.feature.today

import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.ui.DurationCopy
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.finishLabelOf
import com.emm.mygame.core.ui.fixedLabel

internal val todayDurationCopy: DurationCopy = DurationCopy(
    minutesSeconds = R.string.today_duration_minutes_seconds,
    hours = R.string.today_duration_hours,
    hoursMinutes = R.string.today_duration_hours_minutes,
    minutes = R.string.today_duration_minutes,
    finishWithClock = R.string.today_finish_with_clock,
    finishTomorrow = R.string.today_finish_tomorrow,
    finishDay = R.string.today_finish_day,
)

internal fun PlayerCopy.eyebrowOf(eyebrow: TodayUiState.Eyebrow): MyGameLabel = when (eyebrow) {
    TodayUiState.Eyebrow.StartHere -> fixedLabel(fixedCopy(R.string.today_start_here))
    TodayUiState.Eyebrow.WhatIsNext -> chrome(R.string.today_what_is_next)
}

internal fun PlayerCopy.lineOf(card: TodayUiState.FirstCard): MyGameLabel = when (card) {
    is TodayUiState.FirstCard.Study -> chrome(R.string.today_lesson_title, "number" to card.number.toString())
    is TodayUiState.FirstCard.StudyReleased -> fixedLabel(
        fixedCopy(
            R.string.today_released_lesson,
            "band" to card.band.number.toString(),
            "number" to card.position.toString(),
        ),
    )
    is TodayUiState.FirstCard.Reviews ->
        chrome(R.string.today_reviews_due, "count" to formatQuantity(card.count.toLong()))
    is TodayUiState.FirstCard.HoldoutCheck ->
        fixedLabel(fixedCopy(R.string.today_holdout_check, "band" to card.band.number.toString()))
    is TodayUiState.FirstCard.CaughtUp -> when (val line: TodayUiState.CaughtUpLine = card.line) {
        TodayUiState.CaughtUpLine.NoReviewsDue -> chrome(R.string.today_no_reviews_due)
        is TodayUiState.CaughtUpLine.LearningCap -> chrome(
            R.string.today_learning_cap,
            "inLearning" to line.inLearning.toString(),
            "cap" to line.cap.toString(),
        )
    }
}

internal fun PlayerCopy.actionOf(card: TodayUiState.FirstCard): MyGameLabel? = when (card) {
    is TodayUiState.FirstCard.Study -> chrome(R.string.today_study, "number" to card.number.toString())
    is TodayUiState.FirstCard.StudyReleased -> fixedLabel(fixedCopy(R.string.today_study_released))
    is TodayUiState.FirstCard.Reviews ->
        if (card.readFirst == null) chrome(R.string.today_start_reviews) else chrome(R.string.today_read_words)
    is TodayUiState.FirstCard.HoldoutCheck -> fixedLabel(fixedCopy(R.string.today_holdout_open))
    is TodayUiState.FirstCard.CaughtUp -> null
}

internal fun PlayerCopy.nextReviewOf(time: TodayUiState.TimeAt): MyGameLabel = chrome {
    "${text(R.string.today_next_review)} ${finishLabelOf(time.remaining, time.at, todayDurationCopy)}"
}

internal fun PlayerCopy.runningTitleOf(name: LessonName): MyGameLabel = when (name) {
    is LessonName.Shelved -> chrome(R.string.today_lesson_ready_in, "number" to name.number.toString())
    is LessonName.Released -> fixedLabel(
        fixedCopy(
            R.string.today_released_ready_in,
            "band" to name.band.number.toString(),
            "number" to name.set.toString(),
        ),
    )
}

internal fun PlayerCopy.runningTimeOf(running: TodayUiState.RunningLesson): MyGameLabel =
    chrome { finishLabelOf(running.remaining, running.finishesAt, todayDurationCopy) }

internal fun PlayerCopy.workTitleOf(work: TodayUiState.RunningWork): MyGameLabel = chrome {
    text(R.string.today_work_ready_in, "place" to text(placeNameOf(work.building)), "level" to work.level.toString())
}

internal fun PlayerCopy.workTimeOf(work: TodayUiState.RunningWork): MyGameLabel =
    chrome { finishLabelOf(work.remaining, work.finishesAt, todayDurationCopy) }

internal fun PlayerCopy.jobTitleOf(job: TodayUiState.JobOut): MyGameLabel = when (job.phase) {
    TownSnapshot.JobPhase.Outbound -> chrome(R.string.today_job_on_the_way)
    TownSnapshot.JobPhase.Working -> chrome(R.string.today_job_working)
    TownSnapshot.JobPhase.Returning -> chrome(R.string.today_job_coming_back)
}

internal fun PlayerCopy.jobTimeOf(job: TodayUiState.JobOut): MyGameLabel =
    chrome { finishLabelOf(job.remaining, job.finishesAt, todayDurationCopy) }

private fun placeNameOf(kind: TownBuildingKind): Int = when (kind) {
    TownBuildingKind.Homes -> R.string.today_place_homes
    TownBuildingKind.Farm -> R.string.today_place_farm
    TownBuildingKind.Factory -> R.string.today_place_factory
    TownBuildingKind.PowerStation -> R.string.today_place_power_station
    TownBuildingKind.Storage -> R.string.today_place_storage
    TownBuildingKind.School -> R.string.today_place_school
    TownBuildingKind.Office -> R.string.today_place_office
}

internal fun PlayerCopy.startRefusalOf(start: TodayUiState.StartStatus): String? = when (start) {
    TodayUiState.StartStatus.Idle, TodayUiState.StartStatus.Starting -> null
    TodayUiState.StartStatus.Unreachable -> fixedCopy(R.string.today_refusal_unexpected)
    is TodayUiState.StartStatus.Refused -> refusalLineOf(start.refusal)
}

private fun PlayerCopy.refusalLineOf(refusal: TownLessonRefusal): String = when (refusal) {
    is TownLessonRefusal.LearningCapReached -> fixedCopy(
        R.string.today_refusal_learning_cap_reached,
        "cardsInLearning" to refusal.inLearning.toString(),
        "learningCap" to refusal.cap.toString(),
    )
    TownLessonRefusal.StudySlotBusy -> fixedCopy(R.string.today_refusal_study_slot_busy)
    TownLessonRefusal.LessonSchoolTooLow -> fixedCopy(R.string.today_refusal_lesson_school_too_low)
    TownLessonRefusal.LessonAlreadyStudied -> fixedCopy(R.string.today_refusal_lesson_already_studied)
    TownLessonRefusal.LessonUnderStudy -> fixedCopy(R.string.today_refusal_lesson_under_study)
    TownLessonRefusal.TownNotFound -> fixedCopy(R.string.today_refusal_town_not_found)
    TownLessonRefusal.LessonStudyNotFound, TownLessonRefusal.Unrecognized ->
        fixedCopy(R.string.today_refusal_unexpected)
}
