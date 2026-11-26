package com.emm.mygame.core.network.learning

import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.KeepGoingResult
import com.emm.mygame.core.model.learning.KeepGoingWord
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.FrameSpan as WireFrameSpan
import com.emm.mygame.core.network.generated.models.KeepGoingFrames as WireKeepGoingFrames
import com.emm.mygame.core.network.generated.models.KeepGoingWord as WireKeepGoingWord
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.bareKind
import com.emm.mygame.core.network.platform.wireRefusal
import java.io.IOException
import java.net.HttpURLConnection
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiKeepGoingRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : KeepGoingRepository {

    override suspend fun readFrames(): KeepGoingResult = withContext(ioDispatcher) {
        try {
            framesResultOf(api.townFramesGet())
        } catch (expectedOutage: IOException) {
            KeepGoingResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            KeepGoingResult.Unreachable
        }
    }
}

private fun framesResultOf(response: Response<WireKeepGoingFrames>): KeepGoingResult {
    if (response.isSuccessful) {
        val frames: WireKeepGoingFrames = response.body() ?: return KeepGoingResult.Unreachable
        return KeepGoingResult.Read(frames.words.map(::toKeepGoingWord))
    }
    if (response.code() != HttpURLConnection.HTTP_NOT_FOUND) return KeepGoingResult.Unreachable
    val refusal: WireRefusal = response.wireRefusal() ?: return KeepGoingResult.Unreachable
    val isNoTown: Boolean = refusal.bareKind() == BareApiError.Kind.TownNotFound
    return if (isNoTown) KeepGoingResult.NoTown else KeepGoingResult.Unreachable
}

private fun toKeepGoingWord(word: WireKeepGoingWord): KeepGoingWord = KeepGoingWord(
    word = WordId(word.wordId),
    frames = word.frames.map { frame: List<WireFrameSpan> -> frame.toFrameSpans() },
)
