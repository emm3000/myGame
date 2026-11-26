package com.emm.mygame.feature.report

import com.emm.mygame.core.projection.finishClockOf
import com.emm.mygame.core.ui.CopyReader
import java.time.ZoneId
import kotlin.time.Instant

internal fun CopyReader.nextReviewLabelOf(nextReview: Instant, receivedAt: Instant, zone: ZoneId): String =
    clockLabelOf(
        finishClockOf(nextReview, nextReview - receivedAt, zone),
        tomorrow = R.string.report_next_review_tomorrow,
        later = R.string.report_next_review_day,
    )
