package com.emm.mygame.core.model.town

import kotlinx.coroutines.delay

suspend fun <T> readUntilReached(read: suspend () -> ReadAnswer<T>, onUnreachable: () -> Unit): T? {
    while (true) {
        when (val answer: ReadAnswer<T> = read()) {
            is ReadAnswer.Read -> return answer.read
            ReadAnswer.Ended -> return null
            ReadAnswer.Unreachable -> {
                onUnreachable()
                delay(failedReadRetry)
            }
        }
    }
}
