package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.ReviewAnswer
import com.emm.mygame.core.network.generated.models.ReviewAnswerRequest
import com.emm.mygame.core.network.generated.models.StartLessonRequest
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.ReviewHint as WireReviewHint

internal class ApiLearningRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : LearningRepository {

    override suspend fun startLesson(fief: FiefId, lesson: LessonId): StudyResult = studying {
        api.fiefsFiefIdLessonsPost(UUID.fromString(fief.value), StartLessonRequest(lessonId = lesson.value))
    }

    override suspend fun cancelLesson(fief: FiefId, lesson: LessonId): StudyResult = studying {
        api.fiefsFiefIdLessonsLessonIdDelete(fiefId = UUID.fromString(fief.value), lessonId = lesson.value)
    }

    override suspend fun hint(fief: FiefId, word: WordId): ReviewHintResult = withContext(ioDispatcher) {
        try {
            hintedOrRefused(api.fiefsFiefIdReviewsWordIdHintPost(UUID.fromString(fief.value), word.value))
        } catch (expectedOutage: IOException) {
            ReviewHintResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            ReviewHintResult.Unreachable
        }
    }

    override suspend fun answer(fief: FiefId, word: WordId, answer: String): ReviewAnswerResult =
        withContext(ioDispatcher) {
            try {
                val response: Response<ReviewAnswer> = api.fiefsFiefIdReviewsWordIdAnswerPost(
                    fiefId = UUID.fromString(fief.value),
                    wordId = word.value,
                    reviewAnswerRequest = ReviewAnswerRequest(answer = answer),
                )
                answeredOrRefused(response)
            } catch (expectedOutage: IOException) {
                ReviewAnswerResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                ReviewAnswerResult.Unreachable
            }
        }

    private suspend fun studying(call: suspend () -> Response<FiefOverview>): StudyResult =
        withContext(ioDispatcher) {
            try {
                call().toStudyResult()
            } catch (expectedOutage: IOException) {
                StudyResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                StudyResult.Unreachable
            }
        }

    private fun hintedOrRefused(response: Response<WireReviewHint>): ReviewHintResult {
        val hint: WireReviewHint? = response.body()
        if (response.isSuccessful) {
            return if (hint == null) ReviewHintResult.Unreachable else ReviewHintResult.Hinted(hint.toReviewHint())
        }
        val refusal: ApiError = response.apiError() ?: return ReviewHintResult.Unreachable
        return ReviewHintResult.Refused(refusal.kind.toReviewRefusal())
    }

    private fun answeredOrRefused(response: Response<ReviewAnswer>): ReviewAnswerResult {
        if (response.isSuccessful) return response.body()?.toAnswered() ?: ReviewAnswerResult.Unreachable
        val refusal: ApiError = response.apiError() ?: return ReviewAnswerResult.Unreachable
        return ReviewAnswerResult.Refused(refusal.kind.toReviewRefusal())
    }
}

private fun ReviewAnswer.toAnswered(): ReviewAnswerResult.Answered? {
    val answered: ReviewVerdict = verdict.toReviewVerdict() ?: return null
    val snapshot: FiefSnapshot = fief.toSnapshot() ?: return null
    return ReviewAnswerResult.Answered(verdict = answered, fief = snapshot)
}

private fun WireReviewHint.toReviewHint(): ReviewHint = ReviewHint(firstLetter = firstLetter, letterCount = letterCount)

private val reviewRefusals: Map<ApiError.Kind, ReviewRefusal> = mapOf(
    ApiError.Kind.ReviewNotDue to ReviewRefusal.ReviewNotDue,
    ApiError.Kind.HintOnRecognition to ReviewRefusal.HintOnRecognition,
    ApiError.Kind.UnknownChoice to ReviewRefusal.UnknownChoice,
    ApiError.Kind.WordNotHeld to ReviewRefusal.WordNotHeld,
    ApiError.Kind.UnknownWord to ReviewRefusal.UnknownWord,
)

private fun ApiError.Kind.toReviewRefusal(): ReviewRefusal = reviewRefusals[this] ?: ReviewRefusal.Unrecognized
