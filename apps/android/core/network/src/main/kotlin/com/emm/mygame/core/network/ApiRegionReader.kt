package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException

internal class ApiRegionReader(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : RegionReader {

    override suspend fun readMap(area: Int?): RegionMapResult = asking(RegionMapResult.Unreachable) {
        regionMapResultOf(if (area == null) api.townMapGet() else api.townMapAreaGet(area = area.toString()))
    }

    override suspend fun quoteJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): JobQuoteResult =
        asking(JobQuoteResult.Unreachable) { quoteResultOf(api.townJobsQuotePost(sendJobOf(target, team, hours))) }

    override suspend fun quoteCleanUp(target: JobTarget, team: Map<TownHireKind, Int>): CleanUpQuoteResult =
        asking(CleanUpQuoteResult.Unreachable) {
            cleanUpQuoteResultOf(api.townCleanUpsQuotePost(sendCleanUpOf(target, team)))
        }

    private suspend fun <Answer> asking(unreachable: Answer, call: suspend () -> Answer): Answer =
        withContext(ioDispatcher) {
            try {
                call()
            } catch (expectedOutage: IOException) {
                unreachable
            } catch (expectedMalformedBody: SerializationException) {
                unreachable
            }
        }
}
