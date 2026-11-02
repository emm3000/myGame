package com.emm.mygame.core.network

import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response

internal class BearerInterceptor(private val tokenStore: TokenStore) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token: String = tokenStore.read() ?: return chain.proceed(chain.request())
        val request: Request = chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        return chain.proceed(request)
    }
}
