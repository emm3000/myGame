package com.emm.mygame.core.network

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest

internal class HeldAnswers : Dispatcher() {
    private val answers: MutableMap<String, Pair<MockResponse, CountDownLatch>> = ConcurrentHashMap()

    fun holding(path: String, response: MockResponse): CountDownLatch {
        val release = CountDownLatch(1)
        answers[path] = response to release
        return release
    }

    fun answering(path: String, response: MockResponse) {
        answers[path] = response to CountDownLatch(0)
    }

    override fun dispatch(request: RecordedRequest): MockResponse {
        val (response: MockResponse, release: CountDownLatch) = answers.getValue(request.url.encodedPath)
        release.await(RELEASE_WAIT_SECONDS, TimeUnit.SECONDS)
        return response
    }

    private companion object {
        const val RELEASE_WAIT_SECONDS: Long = 5L
    }
}
