package com.emm.mygame.core.network

import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response
import java.io.IOException
import java.net.HttpURLConnection
import com.emm.mygame.core.network.generated.models.FrameSpan as WireFrameSpan
import com.emm.mygame.core.network.generated.models.OpenText as WireOpenText

internal class ApiTownTextRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : TownTextRepository {

    override suspend fun readText(text: TextId): TownTextResult = withContext(ioDispatcher) {
        try {
            textResultOf(api.townTextsTextIdGet(textId = text.value))
        } catch (expectedOutage: IOException) {
            TownTextResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            TownTextResult.Unreachable
        }
    }
}

private fun textResultOf(response: Response<WireOpenText>): TownTextResult {
    if (response.isSuccessful) {
        val text: WireOpenText = response.body() ?: return TownTextResult.Unreachable
        return TownTextResult.Read(text.toOpenText())
    }
    if (response.code() != HttpURLConnection.HTTP_NOT_FOUND) return TownTextResult.Unreachable
    val refusal: WireRefusal = response.wireRefusal() ?: return TownTextResult.NotOpen
    val isNoTown: Boolean = refusal.bareKind() == BareApiError.Kind.TownNotFound
    return if (isNoTown) TownTextResult.NoTown else TownTextResult.Unreachable
}

private fun WireOpenText.toOpenText(): OpenText = OpenText(
    id = TextId(id),
    title = title,
    sentences = sentences.map { sentence: List<WireFrameSpan> -> sentence.toFrameSpans() },
)
