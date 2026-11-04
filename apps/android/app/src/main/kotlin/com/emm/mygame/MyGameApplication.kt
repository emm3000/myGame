package com.emm.mygame

import android.app.Application
import com.emm.mygame.core.network.ChronicleRepository
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.KeystoreTokenCipher
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.MapRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TokenStore
import java.io.File
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers

class MyGameApplication : Application() {

    val clock: Clock = Clock.System

    private val tokenStore: TokenStore by lazy {
        TokenStore(
            file = File(noBackupFilesDir, SESSION_FILE_NAME),
            cipher = KeystoreTokenCipher(keyAlias = SESSION_KEY_ALIAS),
        )
    }

    val sessionEnds: SessionEnds = SessionEnds()

    val sessions: SessionRepository by lazy {
        SessionRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    val listings: FiefListRepository by lazy {
        FiefListRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    val fiefs: FiefRepository by lazy {
        FiefRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    val learning: LearningRepository by lazy {
        LearningRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    val maps: MapRepository by lazy {
        MapRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            ioDispatcher = Dispatchers.IO,
        )
    }

    val chronicles: ChronicleRepository by lazy {
        ChronicleRepository(
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
