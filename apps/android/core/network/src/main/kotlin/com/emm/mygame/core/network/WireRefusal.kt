package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.infrastructure.Serializer
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.BuildingWorkNotFoundError
import com.emm.mygame.core.network.generated.models.LearningCapReachedError
import com.emm.mygame.core.network.generated.models.NotEnoughPeopleError
import com.emm.mygame.core.network.generated.models.NotEnoughResourcesError
import com.emm.mygame.core.network.generated.models.TopLevelReachedError
import com.emm.mygame.core.network.generated.models.WaitingListFullError
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.Response

internal sealed interface WireRefusal {

    data class Bare(val kind: BareApiError.Kind) : WireRefusal

    data class WithParams(val error: ApiError) : WireRefusal
}

internal fun WireRefusal.bareKind(): BareApiError.Kind? = when (this) {
    is WireRefusal.Bare -> kind
    is WireRefusal.WithParams -> null
}

internal fun Response<*>.wireRefusal(): WireRefusal? {
    val body: String = errorBody()?.string() ?: return null
    return try {
        refusalOf(body)
    } catch (expectedMalformedBody: SerializationException) {
        null
    } catch (expectedMalformedBody: IllegalArgumentException) {
        null
    }
}

private val json: Json = Serializer.kotlinxSerializationJson

internal val kindsWithParams: Set<String> = setOf(
    WaitingListFullError.Kind.WaitingListFull.value,
    NotEnoughPeopleError.Kind.NotEnoughPeople.value,
    NotEnoughResourcesError.Kind.NotEnoughResources.value,
    TopLevelReachedError.Kind.TopLevelReached.value,
    BuildingWorkNotFoundError.Kind.BuildingWorkNotFound.value,
    LearningCapReachedError.Kind.LearningCapReached.value,
)

private fun refusalOf(body: String): WireRefusal {
    val kind: String? = json.parseToJsonElement(body).jsonObject["kind"]?.jsonPrimitive?.content
    if (kind in kindsWithParams) return WireRefusal.WithParams(json.decodeFromString(ApiError.serializer(), body))
    return WireRefusal.Bare(json.decodeFromString(BareApiError.serializer(), body).kind)
}
