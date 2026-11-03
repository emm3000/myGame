package com.emm.mygame.core.network

import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow

class SessionEnds {

    private val reports: Channel<Unit> = Channel(Channel.CONFLATED)

    val ended: Flow<Unit> = reports.receiveAsFlow()

    internal fun report() {
        reports.trySend(Unit)
    }
}
