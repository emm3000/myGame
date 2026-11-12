package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownRegistered
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownFillHourTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val localRead: Instant = localInstantOf(LocalDateTime.of(2026, 11, 12, 11, 0))

    @Test
    fun `reads the fill hour within 8 h`() {
        show(fillingMoney(fullAt = localRead + 8.hours))

        composeRule.onNodeWithText("Lleno 19:00").assertIsDisplayed()
        composeRule.onNodeWithText("+30 / h").assertDoesNotExist()
    }

    @Test
    fun `reads tomorrow when the store fills past midnight`() {
        val lateRead: Instant = localInstantOf(LocalDateTime.of(2026, 11, 12, 22, 0))

        show(fillingMoney(fullAt = lateRead + 5.hours), readAt = lateRead)

        composeRule.onNodeWithText("Lleno mañana 03:00").assertIsDisplayed()
    }

    @Test
    fun `reads the rate past 8 h`() {
        show(fillingMoney(fullAt = localRead + 8.hours + 1.minutes))

        composeRule.onNodeWithText("+30 / h").assertIsDisplayed()
        composeRule.onNodeWithText("Lleno", substring = true).assertDoesNotExist()
    }

    @Test
    fun `reads the rate when the store never fills`() {
        show(fillingMoney(fullAt = null))

        composeRule.onNodeWithText("+30 / h").assertIsDisplayed()
        composeRule.onNodeWithText("Lleno", substring = true).assertDoesNotExist()
    }

    @Test
    fun `reads full for a full store`() {
        val fullMoney: TownSnapshot.Stock = stockOf(
            TownResourceKind.Money,
            amount = 900,
            ratePerHour = 30.0,
            capacity = 900,
            fullAt = localRead - 1.hours,
        )

        show(fullMoney)

        composeRule.onNodeWithText("Lleno: 900").assertIsDisplayed()
        composeRule.onNodeWithText("+30 / h").assertIsDisplayed()
    }

    @Test
    fun `reads the answered fill instant even when the rate says otherwise`() {
        val slowMoney: TownSnapshot.Stock = stockOf(
            TownResourceKind.Money,
            amount = 100,
            ratePerHour = 1.0,
            capacity = 900,
            fullAt = localRead + 2.hours,
        )

        show(slowMoney)

        composeRule.onNodeWithText("Lleno 13:00").assertIsDisplayed()
    }

    @Test
    fun `reads the fill hour on the device's clock`() {
        val serverAhead: Duration = 2.hours

        show(fillingMoney(fullAt = localRead + 3.hours), gap = serverAhead)

        composeRule.onNodeWithText("Lleno 12:00").assertIsDisplayed()
    }

    @Test
    fun `measures the 8 h from the read, never from the repaint`() {
        show(fillingMoney(fullAt = localRead + 9.hours), now = localRead + 2.hours)

        composeRule.onNodeWithText("+30 / h").assertIsDisplayed()
        composeRule.onNodeWithText("Lleno", substring = true).assertDoesNotExist()
    }

    private fun fillingMoney(fullAt: Instant?): TownSnapshot.Stock =
        stockOf(TownResourceKind.Money, amount = 120, ratePerHour = 30.0, capacity = 900, fullAt = fullAt)

    private fun show(
        money: TownSnapshot.Stock,
        readAt: Instant = localRead,
        now: Instant = readAt,
        gap: Duration = Duration.ZERO,
    ) {
        val content: TownUiState.Content = townOf(stocks = listOf(money), readAt = readAt).contentAt(
            now = now,
            gap = gap,
            mutations = TownMutations.none,
            registered = TownRegistered.nothing,
            hireEntries = emptyMap(),
            closed = ClosedGuidance.none,
        )
        composeRule.setContent { MyGameTheme { StocksSection(content = content) } }
    }

    private fun localInstantOf(local: LocalDateTime): Instant =
        Instant.fromEpochMilliseconds(local.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
}
