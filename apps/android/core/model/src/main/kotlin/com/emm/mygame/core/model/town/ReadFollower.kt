package com.emm.mygame.core.model.town

import kotlinx.coroutines.delay
import kotlin.time.Duration
import kotlin.time.Instant

abstract class ReadFollower<T> {

    protected open val isStoppedWithNoReadAhead: Boolean = false

    protected abstract fun now(): Instant

    protected abstract fun draw(held: T)

    protected abstract suspend fun read(): ReadAnswer<T>

    protected abstract fun nextReadAfter(held: T, now: Instant): Instant?

    protected abstract fun repaintIn(held: T, now: Instant): Duration

    protected open fun isReadDue(held: T, nextReadAt: Instant?, now: Instant): Boolean =
        nextReadAt != null && nextReadAt <= now

    suspend fun follow(first: T, firstReadAt: Instant?) {
        var held: T = first
        var nextReadAt: Instant? = firstReadAt
        while (true) {
            draw(held)
            if (isReadDue(held, nextReadAt, now())) {
                when (val answer: ReadAnswer<T> = read()) {
                    is ReadAnswer.Read -> {
                        held = answer.read
                        nextReadAt = nextReadAfter(held, now())
                        draw(held)
                    }
                    ReadAnswer.Ended -> return
                    ReadAnswer.Unreachable -> nextReadAt = now() + failedReadRetry
                }
            }
            if (nextReadAt == null && isStoppedWithNoReadAhead) return
            delay(wakeIn(held, nextReadAt, now()))
        }
    }

    private fun wakeIn(held: T, nextReadAt: Instant?, now: Instant): Duration {
        val repaint: Duration = repaintIn(held, now)
        return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
    }
}
