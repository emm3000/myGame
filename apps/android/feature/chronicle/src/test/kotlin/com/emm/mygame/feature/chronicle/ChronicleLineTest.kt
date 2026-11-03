package com.emm.mygame.feature.chronicle

import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import java.time.LocalDateTime
import kotlin.time.Instant
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ChronicleLineTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Before
    fun drawArrivedTransport() {
        composeRule.setContent {
            MyGameTheme {
                ChronicleLine(line = thisMorning, event = arrivedTransport)
            }
        }
    }

    @Test
    fun `reads the amounts as their words alone`() {
        composeRule.onNodeWithText("Transporte recibido:", substring = true)
            .assert(hasText("Recibes 300 de madera y 20 de oro."))
    }

    private val thisMorning: ChronicleInstant =
        ChronicleInstant(ChronicleInstant.Day.Today, LocalDateTime.of(2026, 11, 2, 14, 56))

    private val arrivedTransport: ChronicleEvent = ChronicleEvent.TransportArrived(
        plot = PlotAddress(province = 2, plot = 9),
        fiefName = "Sotoverde",
        cargo = listOf(
            ResourceQuantity(ResourceKind.Wood, 300),
            ResourceQuantity(ResourceKind.Stone, 0),
            ResourceQuantity(ResourceKind.Iron, 0),
            ResourceQuantity(ResourceKind.Gold, 20),
            ResourceQuantity(ResourceKind.Food, 0),
        ),
        occurredAt = Instant.parse("2026-11-02T13:56:00Z"),
    )
}
