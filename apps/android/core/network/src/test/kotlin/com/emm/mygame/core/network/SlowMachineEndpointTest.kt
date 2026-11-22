package com.emm.mygame.core.network

import okhttp3.OkHttpClient
import org.junit.Assert.assertTrue
import org.junit.Test

class SlowMachineEndpointTest {

    private val okHttpDefaultMillis: Int = OkHttpClient().readTimeoutMillis

    @Test
    fun `waits longer than OkHttp's default timeouts before giving up`() {
        val client: OkHttpClient = slowMachineEndpoint("http://localhost/").newHttpClientBuilder().build()

        val waitsMillis: List<Int> =
            listOf(client.connectTimeoutMillis, client.readTimeoutMillis, client.writeTimeoutMillis)

        assertTrue(
            "expected every timeout past OkHttp's $okHttpDefaultMillis ms, the tests' client waits $waitsMillis ms",
            waitsMillis.all { waitMillis: Int -> waitMillis > okHttpDefaultMillis },
        )
    }
}
