package com.emm.mygame

import android.app.Application
import android.content.Context
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.KeystoreTokenCipher
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerLanguages
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReminderNotifications
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.StudyAnswers
import com.emm.mygame.core.network.StudyReminderSettings
import com.emm.mygame.core.network.TokenStore
import com.emm.mygame.core.network.TownRepository
import java.io.File
import java.time.ZoneId
import kotlin.time.Clock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
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

    private val languages: PlayerLanguages by lazy {
        PlayerLanguages(tokenStore, onNamed = { language: PlayerLanguage -> studyReminderStore.nameLanguage(language) })
    }

    private val applicationScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    internal val studyReminderAlarm: StudyReminderAlarm by lazy {
        StudyReminderAlarm(context = this, clock = clock, zone = ZoneId::systemDefault)
    }

    private val reminderStore: Lazy<StudyReminderStore> = lazy {
        StudyReminderStore(
            preferences = getSharedPreferences(STUDY_REMINDER_FILE_NAME, Context.MODE_PRIVATE),
            onChange = studyReminderAlarm::schedule,
        )
    }

    internal val studyReminderStore: StudyReminderStore by reminderStore

    override val studyReminders: StudyReminderSettings
        get() = studyReminderStore

    override val reminderNotifications: ReminderNotifications by lazy { PhoneReminderNotifications(this) }

    private val studyAnswers: StudyAnswers by lazy {
        StudyAnswers(
            tokenStore = tokenStore,
            sink = StudyReminderFeed(store = reminderStore, towns = { towns }, scope = applicationScope),
            clock = clock,
        )
    }

    override fun onCreate() {
        super.onCreate()
        studyAnswers
        studyReminderStore.announce()
    }

    override val playerLanguage: StateFlow<PlayerLanguage?> by lazy { languages.language }

    override val playerScaffold: StateFlow<PlayerScaffold?> by lazy { languages.scaffold }

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
            studyAnswers = studyAnswers,
            ioDispatcher = Dispatchers.IO,
            clock = clock,
        )
    }

    override val learning: LearningRepository by lazy {
        LearningRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            studyAnswers = studyAnswers,
            ioDispatcher = Dispatchers.IO,
        )
    }

    override val reports: ReportRepository by lazy {
        ReportRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            studyAnswers = studyAnswers,
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

    override val holdoutChecks: HoldoutCheckRepository by lazy {
        HoldoutCheckRepository(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            sessionEnds = sessionEnds,
            studyAnswers = studyAnswers,
            ioDispatcher = Dispatchers.IO,
        )
    }

    private companion object {
        const val SESSION_FILE_NAME: String = "session"
        const val SESSION_KEY_ALIAS: String = "mygame.session"
        const val STUDY_REMINDER_FILE_NAME: String = "study_reminder"
    }
}
