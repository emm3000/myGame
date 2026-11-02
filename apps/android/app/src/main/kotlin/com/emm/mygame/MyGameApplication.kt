package com.emm.mygame

import android.app.Application
import com.emm.mygame.core.network.KeystoreTokenCipher
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TokenStore
import java.io.File
import kotlinx.coroutines.Dispatchers

class MyGameApplication : Application() {

    val sessions: SessionRepository by lazy {
        SessionRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = TokenStore(
                file = File(noBackupFilesDir, SESSION_FILE_NAME),
                cipher = KeystoreTokenCipher(keyAlias = SESSION_KEY_ALIAS),
            ),
            ioDispatcher = Dispatchers.IO,
        )
    }

    private companion object {
        const val SESSION_FILE_NAME: String = "session"
        const val SESSION_KEY_ALIAS: String = "mygame.session"
    }
}
