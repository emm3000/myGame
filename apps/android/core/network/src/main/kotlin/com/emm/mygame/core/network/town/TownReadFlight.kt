package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.TownReadResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async

internal class TownReadFlight(private val flights: CoroutineScope, private val answers: TownAnswers) {

    private val holding: Any = Any()

    private var inFlight: Flight? = null

    suspend fun read(send: suspend (TownRequest) -> TownReadResult): TownReadResult =
        synchronized(holding) { flightToJoin() ?: newFlight(send) }.answer.await()

    suspend fun readSentNow(send: suspend (TownRequest) -> TownReadResult): TownReadResult =
        synchronized(holding) { newFlight(send) }.answer.await()

    private fun flightToJoin(): Flight? = inFlight?.takeIf { flight: Flight ->
        !flight.answer.isCompleted && answers.isCurrent(flight.request) && answers.isNewest(flight.request)
    }

    private fun newFlight(send: suspend (TownRequest) -> TownReadResult): Flight {
        val request: TownRequest = answers.sending()
        val answer: Deferred<TownReadResult> = flights.async(start = CoroutineStart.LAZY) { send(request) }
        return Flight(request, answer).also { sent: Flight -> inFlight = sent }
    }

    private class Flight(val request: TownRequest, val answer: Deferred<TownReadResult>)
}
