package com.emm.mygame.core.network.platform

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.network.account.ApiSessionRepository
import com.emm.mygame.core.network.account.PlayerLanguages
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.holdout.ApiHoldoutCheckRepository
import com.emm.mygame.core.network.learning.ApiLearningRepository
import com.emm.mygame.core.network.placement.ApiPlacementRepository
import com.emm.mygame.core.network.reminder.StudyAnswers
import com.emm.mygame.core.network.report.ApiReportRepository
import com.emm.mygame.core.network.town.ApiTownRepository
import com.emm.mygame.core.network.town.ApiTownTextRepository
import com.emm.mygame.core.network.town.TownAnswers
import com.emm.mygame.core.network.town.TownReadFlight
import com.emm.mygame.core.network.town.guidance.ApiTownGuidance
import com.emm.mygame.core.network.town.jobs.ApiRegionReader
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

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
