package com.emm.mygame.core.network

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.network.generated.apis.DefaultApi
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

class ApiRepositories internal constructor(
    private val endpoint: ApiEndpoint,
    private val tokenStore: TokenStore,
    languages: PlayerLanguages,
    private val sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
    clock: Clock,
) {

    constructor(
        baseUrl: String,
        tokenStore: TokenStore,
        languages: PlayerLanguages,
        sessionEnds: SessionEnds,
        studyAnswers: StudyAnswers,
        ioDispatcher: CoroutineDispatcher,
        clock: Clock,
    ) : this(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = okHttpDefaults),
        tokenStore = tokenStore,
        languages = languages,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
        clock = clock,
    )

    val sessions: SessionRepository by lazy {
        ApiSessionRepository(
            api = newSignedInApi(),
            openingApi = accountApi(endpoint = endpoint),
            signOutApi = signOutApi(endpoint = endpoint, tokenStore = tokenStore, callTimeout = signOutTimeout),
            tokenStore = tokenStore,
            languages = languages,
            ioDispatcher = ioDispatcher,
        )
    }

    val towns: TownRepository by lazy {
        val api: DefaultApi = newSignedInApi()
        val answers = TownAnswers(tokenStore = tokenStore, languages = languages, studyAnswers = studyAnswers)
        ApiTownRepository(
            api = api,
            ioDispatcher = ioDispatcher,
            clock = clock,
            answers = answers,
            reads = TownReadFlight(flights = CoroutineScope(SupervisorJob() + ioDispatcher), answers = answers),
            regionReader = ApiRegionReader(api = api, ioDispatcher = ioDispatcher),
            guidance = ApiTownGuidance(api = api, ioDispatcher = ioDispatcher),
        )
    }

    val texts: TownTextRepository by lazy {
        ApiTownTextRepository(
            api = newSignedInApi(),
            ioDispatcher = ioDispatcher,
        )
    }

    val learning: LearningRepository by lazy {
        ApiLearningRepository(
            api = newSignedInApi(),
            studyAnswers = studyAnswers,
            ioDispatcher = ioDispatcher,
        )
    }

    val reports: ReportRepository by lazy {
        ApiReportRepository(
            api = newSignedInApi(),
            studyAnswers = studyAnswers,
            ioDispatcher = ioDispatcher,
        )
    }

    val placements: PlacementRepository by lazy {
        ApiPlacementRepository(
            api = newSignedInApi(),
            ioDispatcher = ioDispatcher,
        )
    }

    val holdoutChecks: HoldoutCheckRepository by lazy {
        ApiHoldoutCheckRepository(
            api = newSignedInApi(),
            studyAnswers = studyAnswers,
            ioDispatcher = ioDispatcher,
        )
    }

    private fun newSignedInApi(): DefaultApi =
        signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds)
}

private val signOutTimeout: Duration = 5.seconds
