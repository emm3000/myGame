package com.emm.mygame.feature.account.settings

import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsReminderOfferViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val allowedNotifications: FakeReminderNotifications =
        FakeReminderNotifications(areAllowed = true, canAsk = true)

    private val offReminder: FakeStudyReminderSettings = FakeStudyReminderSettings(StudyReminderChoice.firstChoice)

    private val onReminder: FakeStudyReminderSettings =
        FakeStudyReminderSettings(StudyReminderChoice.firstChoice.copy(isOn = true))

    private fun reportWith(dueCount: Int): ReportReadResult = ReportReadResult.Read(
        TownReport(
            dueCount = dueCount,
            readFirst = emptyList(),
            nextDueAt = null,
            news = emptyList(),
            readAt = Instant.parse("2026-11-25T18:00:00Z"),
        ),
    )

    private fun shownWith(reminders: FakeStudyReminderSettings, report: ReportReadResult): SettingsViewModel {
        sessions.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)))
        reports.answerRead(report)
        return SettingsViewModel(
            sessions,
            MutableStateFlow(PlayerScaffold.Spanish),
            reminders,
            allowedNotifications,
            reports,
        )
    }

    private fun isOffered(viewModel: SettingsViewModel): Boolean =
        (viewModel.state.value as SettingsUiState.Loaded).reminder.isOffered

    @Test
    fun `offers the reminder with nothing due and the reminder off`() = runTest {
        val viewModel: SettingsViewModel = shownWith(offReminder, reportWith(dueCount = 0))
        runCurrent()

        assertEquals(true, isOffered(viewModel))
    }

    @Test
    fun `offers no reminder while reviews are due`() = runTest {
        val viewModel: SettingsViewModel = shownWith(offReminder, reportWith(dueCount = 2))
        runCurrent()

        assertEquals(false, isOffered(viewModel))
    }

    @Test
    fun `offers no reminder once it is on`() = runTest {
        val viewModel: SettingsViewModel = shownWith(onReminder, reportWith(dueCount = 0))
        runCurrent()

        assertEquals(false, isOffered(viewModel))
    }

    @Test
    fun `offers no reminder while the reviews due cannot be read`() = runTest {
        val viewModel: SettingsViewModel = shownWith(offReminder, ReportReadResult.Unreachable)
        runCurrent()

        assertEquals(false, isOffered(viewModel))
    }

    @Test
    fun `takes the offer away once the reminder is turned on`() = runTest {
        val viewModel: SettingsViewModel = shownWith(offReminder, reportWith(dueCount = 0))
        runCurrent()

        viewModel.onIntent(SettingsIntent.ReminderSwitched(isOn = true))
        runCurrent()

        assertEquals(false, isOffered(viewModel))
    }
}
