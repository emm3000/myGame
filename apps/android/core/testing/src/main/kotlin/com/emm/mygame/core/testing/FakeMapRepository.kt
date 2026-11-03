package com.emm.mygame.core.testing

import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MapRepository
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.job

class FakeMapRepository : MapRepository {

    private val queued: ArrayDeque<MapReadResult> = ArrayDeque()

    private val pending: MutableMap<Int, CompletableDeferred<MapReadResult>> = mutableMapOf()

    private val _requests: MutableList<Int?> = mutableListOf()

    private val _fiefs: MutableList<FiefId> = mutableListOf()

    val requests: List<Int?>
        get() = _requests.toList()

    val fiefs: List<FiefId>
        get() = _fiefs.toList()

    fun answerRead(result: MapReadResult) {
        val oldest: CompletableDeferred<MapReadResult>? = pending.entries
            .filter { (_, read: CompletableDeferred<MapReadResult>) -> read.isActive }
            .minByOrNull { (request: Int, _) -> request }
            ?.value
        if (oldest == null) queued.addLast(result) else oldest.complete(result)
    }

    fun answerRequest(request: Int, result: MapReadResult) {
        checkNotNull(pending[request]) { "No pending read at request $request" }.complete(result)
    }

    override suspend fun readOwn(fief: FiefId): MapReadResult = answerTo(fief, province = null)

    override suspend fun read(fief: FiefId, province: Int): MapReadResult = answerTo(fief, province)

    private suspend fun answerTo(fief: FiefId, province: Int?): MapReadResult {
        val request: Int = _requests.size
        _requests += province
        _fiefs += fief
        queued.removeFirstOrNull()?.let { answer: MapReadResult -> return answer }
        val read: CompletableDeferred<MapReadResult> = CompletableDeferred(parent = currentCoroutineContext().job)
        pending[request] = read
        return read.await()
    }
}
