package com.emm.mygame

import android.app.Application
import android.content.Context
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.holdout.HoldoutCheckRepository
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.placement.PlacementRepository
import com.emm.mygame.core.model.reminder.ReminderNotifications
import com.emm.mygame.core.model.reminder.StudyReminderSettings
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.theme.ThemeSettings
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownTextRepository
import com.emm.mygame.core.network.ApiRepositories
import com.emm.mygame.core.network.KeystoreTokenCipher
import com.emm.mygame.core.network.PlayerLanguages
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.StudyAnswers
import com.emm.mygame.core.network.TokenStore
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

    override val themes: ThemeSettings by lazy {
        ThemeStore(preferences = getSharedPreferences(THEME_FILE_NAME, Context.MODE_PRIVATE))
    }

    private val studyAnswers: StudyAnswers by lazy {
        StudyAnswers(
            tokenStore = tokenStore,
            sink = StudyReminderSink(store = reminderStore, towns = { towns }, scope = applicationScope),
        )
    }

    override fun onCreate() {
        super.onCreate()
        studyAnswers
        studyReminderStore.announce()
    }

    override val playerLanguage: StateFlow<PlayerLanguage?> by lazy { languages.language }

    override val playerScaffold: StateFlow<PlayerScaffold?> by lazy { languages.scaffold }

    private val repositories: ApiRepositories by lazy {
        ApiRepositories(
            baseUrl = BuildConfig.API_BASE_URL,
            tokenStore = tokenStore,
            languages = languages,
            sessionEnds = sessionEnds,
            studyAnswers = studyAnswers,
            ioDispatcher = Dispatchers.IO,
            clock = clock,
        )
    }

    override val sessions: SessionRepository
        get() = repositories.sessions

    override val towns: TownRepository
        get() = repositories.towns

    override val texts: TownTextRepository
        get() = repositories.texts

    override val learning: LearningRepository
        get() = repositories.learning

    override val reports: ReportRepository
        get() = repositories.reports

    override val placements: PlacementRepository
        get() = repositories.placements

    override val holdoutChecks: HoldoutCheckRepository
        get() = repositories.holdoutChecks

    private companion object {
        const val SESSION_FILE_NAME: String = "session"
        const val SESSION_KEY_ALIAS: String = "mygame.session"
        const val STUDY_REMINDER_FILE_NAME: String = "study_reminder"
        const val THEME_FILE_NAME: String = "theme"
    }
}
