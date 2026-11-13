package com.emm.mygame

import android.app.Application
import com.emm.mygame.core.network.KeystoreTokenCipher
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerLanguages
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TokenStore
import com.emm.mygame.core.network.TownRepository
import java.io.File
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.StateFlow

class MyGameApplication : Application(), AppDependencies {

    override val clock: Clock = Clock.System

    private val tokenStore: TokenStore by lazy {
        TokenStore(
            file = File(noBackupFilesDir, SESSION_FILE_NAME),
            cipher = KeystoreTokenCipher(keyAlias = SESSION_KEY_ALIAS),
        )
    }

    override val sessionEnds: SessionEnds = SessionEnds()

    private val languages: PlayerLanguages by lazy { PlayerLanguages(tokenStore) }

    override val playerLanguage: StateFlow<PlayerLanguage?> by lazy { languages.language }

    override val sessions: SessionRepository by lazy {
        SessionRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            languages = languages,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    override val towns: TownRepository by lazy {
        TownRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            languages = languages,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
            clock = clock,
        )
    }

    override val learning: LearningRepository by lazy {
        LearningRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    override val reports: ReportRepository by lazy {
        ReportRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    override val placements: PlacementRepository by lazy {
        PlacementRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    private companion object {
        const val SESSION_FILE_NAME: String = "session"
        const val SESSION_KEY_ALIAS: String = "mygame.session"
    }
}
