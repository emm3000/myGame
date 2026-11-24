package com.emm.mygame.core.network

import com.emm.mygame.core.network.platform.ApiEndpoint
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.toJavaDuration
import okhttp3.OkHttpClient

private val slowMachinePatience: Duration = 60.seconds

internal fun slowMachineEndpoint(baseUrl: String): ApiEndpoint =
    ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = ::slowMachineHttpClient)

private fun slowMachineHttpClient(): OkHttpClient.Builder =
    OkHttpClient.Builder()
        .connectTimeout(slowMachinePatience.toJavaDuration())
        .readTimeout(slowMachinePatience.toJavaDuration())
        .writeTimeout(slowMachinePatience.toJavaDuration())
