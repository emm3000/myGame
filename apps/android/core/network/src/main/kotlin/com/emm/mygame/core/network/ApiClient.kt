package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import kotlin.time.Duration
import kotlin.time.toJavaDuration
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

internal fun signedInApi(baseUrl: String, tokenStore: TokenStore, sessionEnds: SessionEnds): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) { refusedToken: String ->
        if (tokenStore.clearIfHolding(refusedToken)) sessionEnds.report()
    }
    return defaultApi(baseUrl = baseUrl, client = bearerClient(bearer = bearer, callTimeout = Duration.ZERO))
}

internal fun signOutApi(baseUrl: String, tokenStore: TokenStore, callTimeout: Duration): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) {}
    return defaultApi(baseUrl = baseUrl, client = bearerClient(bearer = bearer, callTimeout = callTimeout))
}

internal fun accountApi(baseUrl: String): DefaultApi = defaultApi(baseUrl = baseUrl, client = OkHttpClient())

private fun bearerClient(bearer: BearerInterceptor, callTimeout: Duration): OkHttpClient =
    OkHttpClient.Builder()
        .addInterceptor(bearer)
        .callTimeout(callTimeout.toJavaDuration())
        .build()

private fun defaultApi(baseUrl: String, client: OkHttpClient): DefaultApi {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(IsoInstantConverterFactory())
        .addConverterFactory(KnownTownNewsConverterFactory(Serializer.kotlinxSerializationJson))
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
