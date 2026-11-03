package com.emm.mygame.core.network

import java.net.HttpURLConnection
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response

internal class BearerInterceptor(
    private val tokenStore: TokenStore,
    private val onRefused: (refusedToken: String) -> Unit,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token: String = tokenStore.read() ?: return chain.proceed(chain.request())
        val request: Request = chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        val response: Response = chain.proceed(request)
        if (response.code == HttpURLConnection.HTTP_UNAUTHORIZED) onRefused(token)
        return response
    }
}
