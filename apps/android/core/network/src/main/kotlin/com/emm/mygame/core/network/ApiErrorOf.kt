package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.infrastructure.Serializer
import com.emm.mygame.core.network.generated.models.ApiError
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal fun Response<*>.apiError(): ApiError? {
    val body: String = errorBody()?.string() ?: return null
    return try {
        Serializer.kotlinxSerializationJson.decodeFromString(ApiError.serializer(), body)
    } catch (expectedMalformedBody: SerializationException) {
        null
    }
}
