package com.emm.mygame

import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.jobs.TownRegionRepository
import com.emm.mygame.core.network.account.PlayerLanguages
import com.emm.mygame.core.network.platform.ApiRepositories
import com.emm.mygame.core.network.platform.KeystoreTokenCipher
import com.emm.mygame.core.network.platform.SessionEnds
import com.emm.mygame.core.network.platform.TokenCipher
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.navigation.screenBindings
import com.emm.mygame.reminder.StudyReminderStore
import com.emm.mygame.reminder.reminderBindings
import com.emm.mygame.theme.themeBindings
import java.io.File
import kotlin.time.Clock
import kotlinx.coroutines.Dispatchers
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.bind
import org.koin.dsl.binds
import org.koin.dsl.module

val appBindings: Module
    get() = module {
        includes(reminderBindings, themeBindings, screenBindings)
        single<Clock> { Clock.System }
        single { KeystoreTokenCipher(keyAlias = SESSION_KEY_ALIAS) } bind TokenCipher::class
        single { TokenStore(file = File(androidContext().noBackupFilesDir, SESSION_FILE_NAME), cipher = get()) }
        single { SessionEnds() }
        single {
            PlayerLanguages(
                tokenStore = get(),
                onNamed = { language: PlayerLanguage -> get<StudyReminderStore>().nameLanguage(language) },
            )
        }
        single {
            ApiRepositories(
                baseUrl = BuildConfig.API_BASE_URL,
                tokenStore = get(),
                languages = get(),
                sessionEnds = get(),
                studyAnswers = get(),
                ioDispatcher = Dispatchers.IO,
                clock = get(),
            )
        }
        single { get<ApiRepositories>().sessions }
        single<TownRepository> {
            get<ApiRepositories>().towns
        } binds arrayOf(TownReader::class, TownRegionRepository::class)
        single { get<ApiRepositories>().texts }
        single { get<ApiRepositories>().keepGoing }
        single { get<ApiRepositories>().learning }
        single { get<ApiRepositories>().reports }
        single { get<ApiRepositories>().placements }
        single { get<ApiRepositories>().holdoutChecks }
    }

private const val SESSION_FILE_NAME: String = "session"

private const val SESSION_KEY_ALIAS: String = "mygame.session"
