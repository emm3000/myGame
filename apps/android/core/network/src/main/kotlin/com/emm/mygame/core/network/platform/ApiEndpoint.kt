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

internal class ApiEndpoint(val baseUrl: String, val newHttpClientBuilder: () -> OkHttpClient.Builder)

internal fun ApiEndpoint.signedInApi(tokenStore: TokenStore, sessionEnds: SessionEnds): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) { refusedToken: String ->
        if (tokenStore.clearIfHolding(refusedToken)) sessionEnds.report()
    }
    return defaultApi(client = bearerClient(bearer = bearer, callTimeout = Duration.ZERO))
}

internal fun ApiEndpoint.signOutApi(tokenStore: TokenStore, callTimeout: Duration): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) {}
    return defaultApi(client = bearerClient(bearer = bearer, callTimeout = callTimeout))
}

internal fun ApiEndpoint.accountApi(): DefaultApi = defaultApi(client = newHttpClientBuilder().build())

private fun ApiEndpoint.bearerClient(bearer: BearerInterceptor, callTimeout: Duration): OkHttpClient =
    newHttpClientBuilder()
        .addInterceptor(bearer)
        .callTimeout(callTimeout.toJavaDuration())
        .build()

private fun ApiEndpoint.defaultApi(client: OkHttpClient): DefaultApi {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(IsoInstantConverterFactory())
        .addConverterFactory(KnownTownNewsConverterFactory(Serializer.kotlinxSerializationJson))
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
