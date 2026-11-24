package com.emm.mygame.core.network.learning

import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewHintResult
import com.emm.mygame.core.model.learning.ReviewHintWord
import com.emm.mygame.core.model.learning.ReviewRefusal
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.ReviewAnswer
import com.emm.mygame.core.network.generated.models.ReviewAnswerRequest
import com.emm.mygame.core.network.generated.models.ReviewHint as WireReviewHint
import com.emm.mygame.core.network.generated.models.ReviewHintWord as WireReviewHintWord
import com.emm.mygame.core.network.generated.models.Reviews
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.bareKind
import com.emm.mygame.core.network.platform.wireRefusal
import com.emm.mygame.core.network.reminder.StudyAnswers
import com.emm.mygame.core.network.reminder.StudyRequest
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiLearningRepository(
    private val api: DefaultApi,
    private val studyAnswers: StudyAnswers,
    private val ioDispatcher: CoroutineDispatcher,
) : LearningRepository {

    override suspend fun reviews(): ReviewsReadResult = withContext(ioDispatcher) {
        try {
            val study: StudyRequest = studyAnswers.sending()
            readOrUnreachable(api.reviewsGet(), study)
        } catch (expectedOutage: IOException) {
            ReviewsReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            ReviewsReadResult.Unreachable
        }
    }

    override suspend fun hint(word: WordId): ReviewHintResult = withContext(ioDispatcher) {
        try {
            hintedOrRefused(api.reviewsWordIdHintPost(word.value))
        } catch (expectedOutage: IOException) {
            ReviewHintResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            ReviewHintResult.Unreachable
        }
    }

    override suspend fun answer(word: WordId, answer: String): ReviewAnswerResult =
        withContext(ioDispatcher) {
            try {
                val response: Response<ReviewAnswer> = api.reviewsWordIdAnswerPost(
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

    private fun readOrUnreachable(response: Response<Reviews>, study: StudyRequest): ReviewsReadResult {
        val reviews: Reviews? = response.body()
        if (!response.isSuccessful || reviews == null) return ReviewsReadResult.Unreachable
        val due: DueReviews = reviews.toDueReviews()
        studyAnswers.reviewsAnswered(study, due)
        return ReviewsReadResult.Read(due)
    }

    private fun hintedOrRefused(response: Response<WireReviewHint>): ReviewHintResult {
        val hint: WireReviewHint? = response.body()
        if (response.isSuccessful) {
            return if (hint == null) ReviewHintResult.Unreachable else ReviewHintResult.Hinted(hint.toReviewHint())
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return ReviewHintResult.Unreachable
        return ReviewHintResult.Refused(refusal.toReviewRefusal())
    }

    private fun answeredOrRefused(response: Response<ReviewAnswer>): ReviewAnswerResult {
        if (response.isSuccessful) return response.body()?.toAnswered() ?: ReviewAnswerResult.Unreachable
        val refusal: WireRefusal = response.wireRefusal() ?: return ReviewAnswerResult.Unreachable
        return ReviewAnswerResult.Refused(refusal.toReviewRefusal())
    }
}

private fun ReviewAnswer.toAnswered(): ReviewAnswerResult.Answered =
    ReviewAnswerResult.Answered(verdict = verdict.toReviewVerdict())

private fun WireReviewHint.toReviewHint(): ReviewHint =
    ReviewHint(words = words.map(WireReviewHintWord::toReviewHintWord))

private fun WireReviewHintWord.toReviewHintWord(): ReviewHintWord =
    ReviewHintWord(firstLetter = firstLetter, letterCount = letterCount)

private val reviewRefusals: Map<BareApiError.Kind, ReviewRefusal> = mapOf(
    BareApiError.Kind.ReviewNotDue to ReviewRefusal.ReviewNotDue,
    BareApiError.Kind.HintOnRecognition to ReviewRefusal.HintOnRecognition,
    BareApiError.Kind.UnknownChoice to ReviewRefusal.UnknownChoice,
    BareApiError.Kind.WordNotHeld to ReviewRefusal.WordNotHeld,
    BareApiError.Kind.UnknownWord to ReviewRefusal.UnknownWord,
)

private fun WireRefusal.toReviewRefusal(): ReviewRefusal =
    bareKind()?.let(reviewRefusals::get) ?: ReviewRefusal.Unrecognized
