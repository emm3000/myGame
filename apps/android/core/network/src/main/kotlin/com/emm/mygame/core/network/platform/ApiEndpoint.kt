package com.emm.mygame.core.network.platform

import okhttp3.OkHttpClient

internal class ApiEndpoint(val baseUrl: String, val newHttpClientBuilder: () -> OkHttpClient.Builder)
