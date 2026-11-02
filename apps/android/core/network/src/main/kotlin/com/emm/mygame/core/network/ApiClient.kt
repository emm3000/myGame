package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import kotlin.time.Duration
import kotlin.time.toJavaDuration
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

internal fun defaultApi(baseUrl: String, tokenStore: TokenStore): DefaultApi =
    defaultApi(baseUrl = baseUrl, tokenStore = tokenStore, callTimeout = Duration.ZERO)

internal fun defaultApi(baseUrl: String, tokenStore: TokenStore, callTimeout: Duration): DefaultApi {
    val client: OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(BearerInterceptor(tokenStore))
        .callTimeout(callTimeout.toJavaDuration())
        .build()
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
