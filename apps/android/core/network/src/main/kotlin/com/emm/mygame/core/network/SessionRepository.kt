package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import kotlinx.coroutines.CoroutineDispatcher
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

interface SessionRepository {

    suspend fun signIn(email: String, password: String): SignInResult

    suspend fun restore(): RestoreResult
}

fun SessionRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): SessionRepository {
    val client: OkHttpClient = OkHttpClient.Builder().addInterceptor(BearerInterceptor(tokenStore)).build()
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return ApiSessionRepository(
        api = retrofit.create(DefaultApi::class.java),
        tokenStore = tokenStore,
        ioDispatcher = ioDispatcher,
    )
}
