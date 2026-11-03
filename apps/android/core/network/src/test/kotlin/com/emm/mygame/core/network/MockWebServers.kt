package com.emm.mygame.core.network

import java.util.concurrent.TimeUnit
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest

private const val REQUEST_WAIT_SECONDS: Long = 5

fun MockWebServer.takeRequestWithin(): RecordedRequest =
    takeRequest(REQUEST_WAIT_SECONDS, TimeUnit.SECONDS)
        ?: error("no request reached the mock server within $REQUEST_WAIT_SECONDS seconds")
