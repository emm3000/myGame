package com.emm.mygame.core.network.platform

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import com.emm.mygame.core.network.town.news.KnownTownNewsConverterFactory
import kotlin.time.Duration
import kotlin.time.toJavaDuration
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

internal val okHttpDefaults: () -> OkHttpClient.Builder = OkHttpClient::Builder

internal fun signedInApi(endpoint: ApiEndpoint, tokenStore: TokenStore, sessionEnds: SessionEnds): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) { refusedToken: String ->
        if (tokenStore.clearIfHolding(refusedToken)) sessionEnds.report()
    }
    val client: OkHttpClient = bearerClient(endpoint = endpoint, bearer = bearer, callTimeout = Duration.ZERO)
    return defaultApi(endpoint = endpoint, client = client)
}

internal fun signOutApi(endpoint: ApiEndpoint, tokenStore: TokenStore, callTimeout: Duration): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) {}
    val client: OkHttpClient = bearerClient(endpoint = endpoint, bearer = bearer, callTimeout = callTimeout)
    return defaultApi(endpoint = endpoint, client = client)
}

internal fun accountApi(endpoint: ApiEndpoint): DefaultApi =
    defaultApi(endpoint = endpoint, client = endpoint.newHttpClientBuilder().build())

private fun bearerClient(endpoint: ApiEndpoint, bearer: BearerInterceptor, callTimeout: Duration): OkHttpClient =
    endpoint.newHttpClientBuilder()
        .addInterceptor(bearer)
        .callTimeout(callTimeout.toJavaDuration())
        .build()

private fun defaultApi(endpoint: ApiEndpoint, client: OkHttpClient): DefaultApi {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(endpoint.baseUrl)
        .client(client)
        .addConverterFactory(IsoInstantConverterFactory())
        .addConverterFactory(KnownTownNewsConverterFactory(Serializer.kotlinxSerializationJson))
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
