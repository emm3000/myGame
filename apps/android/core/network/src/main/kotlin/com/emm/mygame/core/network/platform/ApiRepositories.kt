package com.emm.mygame.core.network.platform

import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.network.account.ApiSessionRepository
import com.emm.mygame.core.network.account.PlayerLanguages
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.infrastructure.Serializer
import com.emm.mygame.core.network.holdout.ApiHoldoutCheckRepository
import com.emm.mygame.core.network.learning.ApiKeepGoingRepository
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
import com.emm.mygame.core.network.town.news.KnownTownNewsConverterFactory
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.toJavaDuration
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

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
            openingApi = endpoint.accountApi(),
            signOutApi = endpoint.signOutApi(tokenStore = tokenStore, callTimeout = signOutTimeout),
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

    val keepGoing: KeepGoingRepository by lazy {
        ApiKeepGoingRepository(
            api = newSignedInApi(),
            ioDispatcher = ioDispatcher,
        )
    }

    val learning: LearningRepository by lazy {
        ApiLearningRepository(
            api = newSignedInApi(),
            answeringApi = endpoint.unretriedSignedInApi(tokenStore = tokenStore, sessionEnds = sessionEnds),
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
        endpoint.signedInApi(tokenStore = tokenStore, sessionEnds = sessionEnds)
}

private val signOutTimeout: Duration = 5.seconds

private val okHttpDefaults: () -> OkHttpClient.Builder = OkHttpClient::Builder

private fun ApiEndpoint.signedInApi(tokenStore: TokenStore, sessionEnds: SessionEnds): DefaultApi =
    defaultApi(client = signedInClient(tokenStore = tokenStore, sessionEnds = sessionEnds))

private fun ApiEndpoint.unretriedSignedInApi(tokenStore: TokenStore, sessionEnds: SessionEnds): DefaultApi {
    val signedIn: OkHttpClient = signedInClient(tokenStore = tokenStore, sessionEnds = sessionEnds)
    return defaultApi(client = signedIn.newBuilder().retryOnConnectionFailure(false).build())
}

private fun ApiEndpoint.signedInClient(tokenStore: TokenStore, sessionEnds: SessionEnds): OkHttpClient {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) { refusedToken: String ->
        if (tokenStore.clearIfHolding(refusedToken)) sessionEnds.report()
    }
    return bearerClient(bearer = bearer, callTimeout = Duration.ZERO)
}

private fun ApiEndpoint.signOutApi(tokenStore: TokenStore, callTimeout: Duration): DefaultApi {
    val bearer: BearerInterceptor = BearerInterceptor(tokenStore = tokenStore) {}
    return defaultApi(client = bearerClient(bearer = bearer, callTimeout = callTimeout))
}

private fun ApiEndpoint.accountApi(): DefaultApi = defaultApi(client = newHttpClientBuilder().build())

private fun ApiEndpoint.bearerClient(bearer: BearerInterceptor, callTimeout: Duration): OkHttpClient =
    newHttpClientBuilder()
        .addInterceptor(bearer)
        .callTimeout(callTimeout.toJavaDuration())
        .build()

private fun ApiEndpoint.defaultApi(client: OkHttpClient): DefaultApi {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(IsoInstantConverterFactory())
        .addConverterFactory(KnownTownNewsConverterFactory(Serializer.kotlinxSerializationJson))
        .addConverterFactory(Serializer.kotlinxSerializationJson.asConverterFactory("application/json".toMediaType()))
        .build()
    return retrofit.create(DefaultApi::class.java)
}
