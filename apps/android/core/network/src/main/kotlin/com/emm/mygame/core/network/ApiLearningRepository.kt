package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.ReviewAnswer
import com.emm.mygame.core.network.generated.models.ReviewAnswerRequest
import com.emm.mygame.core.network.generated.models.Reviews
import java.io.IOException
import java.util.Date
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.ReviewHint as WireReviewHint

internal class ApiLearningRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : LearningRepository {

    override suspend fun reviews(): ReviewsReadResult = withContext(ioDispatcher) {
        try {
            readOrUnreachable(api.reviewsGet())
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

    private fun readOrUnreachable(response: Response<Reviews>): ReviewsReadResult {
        val reviews: Reviews? = response.body()
        val servedAt: Date? = response.headers().getDate("Date")
        if (!response.isSuccessful || reviews == null || servedAt == null) return ReviewsReadResult.Unreachable
        val readAt: Instant = Instant.fromEpochMilliseconds(servedAt.time)
        return ReviewsReadResult.Read(reviews.toDueReviews(readAt))
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

private fun WireReviewHint.toReviewHint(): ReviewHint = ReviewHint(firstLetter = firstLetter, letterCount = letterCount)

private val reviewRefusals: Map<BareApiError.Kind, ReviewRefusal> = mapOf(
    BareApiError.Kind.ReviewNotDue to ReviewRefusal.ReviewNotDue,
    BareApiError.Kind.HintOnRecognition to ReviewRefusal.HintOnRecognition,
    BareApiError.Kind.UnknownChoice to ReviewRefusal.UnknownChoice,
    BareApiError.Kind.WordNotHeld to ReviewRefusal.WordNotHeld,
    BareApiError.Kind.UnknownWord to ReviewRefusal.UnknownWord,
)

private fun WireRefusal.toReviewRefusal(): ReviewRefusal =
    bareKind()?.let(reviewRefusals::get) ?: ReviewRefusal.Unrecognized
