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
    return defaultApi(baseUrl = baseUrl, bearer = bearer, callTimeout = Duration.ZERO)
}

internal fun authApi(baseUrl: String, tokenStore: TokenStore, callTimeout: Duration): DefaultApi =
    defaultApi(baseUrl = baseUrl, bearer = BearerInterceptor(tokenStore = tokenStore) {}, callTimeout = callTimeout)

private fun defaultApi(baseUrl: String, bearer: BearerInterceptor, callTimeout: Duration): DefaultApi {
    val client: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(bearer)
        .callTimeout(callTimeout.toJavaDuration())
        .build()
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(IsoInstantConverterFactory())
        .addConverterFactory(KnownFiefEventsConverterFactory(Serializer.kotlinxSerializationJson))
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
