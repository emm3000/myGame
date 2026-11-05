package com.emm.mygame.feature.chronicle

import android.content.res.Resources
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.ChronicleEvent
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import java.time.LocalDateTime
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ChronicleCopyTest {

    private val resources: Resources = RuntimeEnvironment.getApplication().resources

    @Test
    fun `closes losses of several kinds with a comma before the bandits`() {
        val costlyWin: ChronicleEvent = battle(isWon = true, unitsLost = units(infantry = 2, cavalry = 2), campLost = 6)

        assertEquals(
            "provincia 2, parcela 9, campamento de nivel 1. Pierdes 2 infantes y 2 jinetes, " +
                "y los bandidos pierden 6 de fuerza.",
            resources.subjectOf(costlyWin),
        )
    }

    @Test
    fun `names losses of one kind without a comma`() {
        val oneKindLost: ChronicleEvent = battle(isWon = true, unitsLost = units(archer = 1), campLost = 4)

        assertEquals(
            "provincia 2, parcela 9, campamento de nivel 1. Pierdes 1 arquero y los bandidos pierden 4 de fuerza.",
            resources.subjectOf(oneKindLost),
        )
    }

    @Test
    fun `says no one is lost when a battle costs no men`() {
        val bloodlessLoss: ChronicleEvent = battle(isWon = false, unitsLost = units(), campLost = 0)

        assertEquals(
            "provincia 2, parcela 9, campamento de nivel 1. No pierdes a nadie y los bandidos pierden 0 de fuerza.",
            resources.subjectOf(bloodlessLoss),
        )
    }

    @Test
    fun `reads an empty party as 0 infantes`() {
        val emptyMarch: ChronicleEvent = march(units = units(), isRecalled = false)

        assertEquals("provincia 2, parcela 9, 0 infantes.", resources.subjectOf(emptyMarch))
    }

    @Test
    fun `writes a count of ten thousand men without a thousands separator`() {
        val hugeMarch: ChronicleEvent = march(units = units(infantry = 10_000), isRecalled = false)

        assertEquals("provincia 2, parcela 9, 10000 infantes.", resources.subjectOf(hugeMarch))
    }

    @Test
    fun `heads a recalled march as withdrawn`() {
        val recalledMarch: ChronicleEvent = march(units = units(infantry = 4), isRecalled = true)

        assertEquals("Marcha retirada:", resources.headingOf(recalledMarch))
    }

    @Test
    fun `heads a lost battle as lost`() {
        val lostBattle: ChronicleEvent = battle(isWon = false, unitsLost = units(infantry = 3), campLost = 1)

        assertEquals("Batalla perdida:", resources.headingOf(lostBattle))
    }

    @Test
    fun `leaves a zero amount out of the refund`() {
        val woodOnlyRefund: ChronicleEvent = cancelledFarm(refund = amounts(wood = 110))

        assertEquals("Recuperas 110 de madera.", resources.amountsOf(woodOnlyRefund))
    }

    @Test
    fun `draws no amounts when every amount is zero`() {
        val emptyRefund: ChronicleEvent = cancelledFarm(refund = amounts())

        assertNull(resources.amountsOf(emptyRefund))
    }

    @Test
    fun `groups the thousands of an amount sent`() {
        val heavyCargo: ChronicleEvent = ChronicleEvent.TransportSent(
            plot = plot,
            fiefName = "Sotoverde del Páramo",
            cargo = amounts(stone = 1200, food = 50),
            occurredAt = anInstant,
        )

        assertEquals("Envías 1 200 de piedra y 50 de comida.", resources.amountsOf(heavyCargo))
    }

    @Test
    fun `marks each amount sent where its words start`() {
        val heavyCargo: ChronicleEvent = ChronicleEvent.TransportSent(
            plot = plot,
            fiefName = "Sotoverde del Páramo",
            cargo = amounts(stone = 1200, food = 50),
            occurredAt = anInstant,
        )

        assertEquals(
            listOf(AmountMark(ResourceKind.Stone, start = 7), AmountMark(ResourceKind.Food, start = 25)),
            resources.amountMarksOf(heavyCargo),
        )
    }

    @Test
    fun `marks no amount when every amount is zero`() {
        val emptyRefund: ChronicleEvent = cancelledFarm(refund = amounts())

        assertEquals(emptyList<AmountMark>(), resources.amountMarksOf(emptyRefund))
    }

    @Test
    fun `shows the year of an instant from an earlier year`() {
        val lastYear: ChronicleInstant =
            ChronicleInstant(ChronicleInstant.Day.EarlierYear, LocalDateTime.of(2025, 9, 28, 15, 16))

        assertEquals("28 sept 2025, 15:16", resources.instantLabelOf(lastYear))
    }

    @Test
    fun `shows the day without the year for an instant of this year`() {
        val lastWeek: ChronicleInstant =
            ChronicleInstant(ChronicleInstant.Day.ThisYear, LocalDateTime.of(2026, 10, 30, 9, 5))

        assertEquals("30 oct, 09:05", resources.instantLabelOf(lastWeek))
    }

    @Test
    fun `shows only the time for an instant of today`() {
        val thisMorning: ChronicleInstant =
            ChronicleInstant(ChronicleInstant.Day.Today, LocalDateTime.of(2026, 11, 2, 14, 56))

        assertEquals("Hoy, 14:56", resources.instantLabelOf(thisMorning))
    }

    private val plot: PlotAddress = PlotAddress(province = 2, plot = 9)

    private val anInstant: Instant = Instant.parse("2026-11-02T18:00:00Z")

    private fun battle(isWon: Boolean, unitsLost: List<UnitCount>, campLost: Int): ChronicleEvent =
        ChronicleEvent.BattleFought(
            plot = plot,
            campTier = 1,
            isWon = isWon,
            unitsLost = unitsLost,
            campLost = campLost,
            occurredAt = anInstant,
        )

    private fun march(units: List<UnitCount>, isRecalled: Boolean): ChronicleEvent = ChronicleEvent.MarchReturned(
        plot = plot,
        units = units,
        loot = amounts(),
        isRecalled = isRecalled,
        occurredAt = anInstant,
    )

    private fun cancelledFarm(refund: List<ResourceQuantity>): ChronicleEvent = ChronicleEvent.UpgradeCancelled(
        building = BuildingKind.Farm,
        level = 3,
        refund = refund,
        occurredAt = anInstant,
    )

    private fun amounts(
        wood: Long = 0,
        stone: Long = 0,
        iron: Long = 0,
        gold: Long = 0,
        food: Long = 0,
    ): List<ResourceQuantity> = listOf(
        ResourceQuantity(ResourceKind.Wood, wood),
        ResourceQuantity(ResourceKind.Stone, stone),
        ResourceQuantity(ResourceKind.Iron, iron),
        ResourceQuantity(ResourceKind.Gold, gold),
        ResourceQuantity(ResourceKind.Food, food),
    )

    private fun units(infantry: Int = 0, cavalry: Int = 0, archer: Int = 0, settler: Int = 0): List<UnitCount> =
        listOf(
            UnitCount(UnitKind.Infantry, infantry),
            UnitCount(UnitKind.Cavalry, cavalry),
            UnitCount(UnitKind.Archer, archer),
            UnitCount(UnitKind.Settler, settler),
        )
}
