package com.emm.mygame.feature.report

import android.content.res.Resources
import com.emm.mygame.core.network.TownAmount
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import java.time.ZoneId
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReportCopyTest {

    private val resources: Resources = RuntimeEnvironment.getApplication().resources

    private val at: Instant = Instant.parse("2026-11-05T14:56:00Z")

    private val site: TownSite = TownSite(region = 1, area = 2, site = 3)

    private val lima: ZoneId = ZoneId.of("America/Lima")

    @Test
    fun `tells a building work finished`() {
        val news: TownNews = TownNews.BuildingWorkFinished(at, TownBuildingKind.PowerStation, level = 3)

        assertEquals("Central eléctrica: ahora en nivel 3.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a building work stopped`() {
        val news: TownNews = TownNews.BuildingWorkStopped(at, TownBuildingKind.Storage, level = 2)

        assertEquals("Paraste la obra: Almacén, nivel 2.", resources.newsLineOf(news))
    }

    @Test
    fun `names every place of the town`() {
        val names: List<String> = TownBuildingKind.entries.map { building: TownBuildingKind ->
            resources.newsLineOf(TownNews.BuildingWorkFinished(at, building, level = 1)).substringBefore(":")
        }

        assertEquals(
            listOf("Hogares", "Granja", "Fábrica", "Central eléctrica", "Almacén", "Escuela", "Oficina"),
            names,
        )
    }

    @Test
    fun `tells a lesson studied`() {
        assertEquals("Estudiaste una lección.", resources.newsLineOf(TownNews.LessonStudied(at)))
    }

    @Test
    fun `tells a lesson stopped`() {
        assertEquals("Paraste el estudio de una lección.", resources.newsLineOf(TownNews.LessonStopped(at)))
    }

    @Test
    fun `tells a skill earned with its resource and percent`() {
        val news: TownNews = TownNews.SkillEarned(at, TownResourceKind.Power, ratePercent = 5)

        assertEquals("Ganaste una habilidad de energía: +5 % de energía.", resources.newsLineOf(news))
    }

    @Test
    fun `names every resource of the town`() {
        val names: List<String> = TownResourceKind.entries.map { resource: TownResourceKind ->
            resources.payLineOf(TownNews.CleanUpDone(at, site, listOf(TownAmount(resource, 2)))).orEmpty()
        }

        assertEquals(
            listOf("Pago: 2 de dinero", "Pago: 2 de comida", "Pago: 2 de energía", "Pago: 2 de material"),
            names,
        )
    }

    @Test
    fun `tells one worker hired`() {
        val news: TownNews = TownNews.HiringDelivered(at, TownHireKind.Worker, count = 1)

        assertEquals("Contrataste 1 trabajador.", resources.newsLineOf(news))
    }

    @Test
    fun `tells many workers hired`() {
        val news: TownNews = TownNews.HiringDelivered(at, TownHireKind.Worker, count = 10000)

        assertEquals("Contrataste 10000 trabajadores.", resources.newsLineOf(news))
    }

    @Test
    fun `tells one truck hired`() {
        val news: TownNews = TownNews.HiringDelivered(at, TownHireKind.Truck, count = 1)

        assertEquals("Contrataste 1 camión.", resources.newsLineOf(news))
    }

    @Test
    fun `tells many trucks hired`() {
        val news: TownNews = TownNews.HiringDelivered(at, TownHireKind.Truck, count = 3)

        assertEquals("Contrataste 3 camiones.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a stopped hiring of workers with one come`() {
        val news: TownNews = TownNews.HiringStopped(at, TownHireKind.Worker, delivered = 1, stopped = 4)

        assertEquals("Paraste la contratación de trabajadores: llegó 1 de 5.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a stopped hiring of workers with many come`() {
        val news: TownNews = TownNews.HiringStopped(at, TownHireKind.Worker, delivered = 3, stopped = 2)

        assertEquals("Paraste la contratación de trabajadores: llegaron 3 de 5.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a stopped hiring of trucks with one come`() {
        val news: TownNews = TownNews.HiringStopped(at, TownHireKind.Truck, delivered = 1, stopped = 1)

        assertEquals("Paraste la contratación de camiones: llegó 1 de 2.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a stopped hiring of trucks with none come`() {
        val news: TownNews = TownNews.HiringStopped(at, TownHireKind.Truck, delivered = 0, stopped = 2)

        assertEquals("Paraste la contratación de camiones: llegaron 0 de 2.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a job back with its site`() {
        val news: TownNews = TownNews.JobBack(at, site, pay = emptyList())

        assertEquals("Tu equipo volvió de la región 1, zona 2, sitio 3.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a job called back with its site`() {
        val news: TownNews = TownNews.JobCalledBack(at, site, pay = emptyList())

        assertEquals("Llamaste de vuelta a tu equipo de la región 1, zona 2, sitio 3.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a clean-up done with its site`() {
        val news: TownNews = TownNews.CleanUpDone(at, site, reward = emptyList())

        assertEquals("Tu equipo limpió los residuos de la región 1, zona 2, sitio 3.", resources.newsLineOf(news))
    }

    @Test
    fun `tells a clean-up failed with its site`() {
        val news: TownNews = TownNews.CleanUpFailed(at, site)

        assertEquals(
            "Tu equipo no pudo limpiar los residuos de la región 1, zona 2, sitio 3.",
            resources.newsLineOf(news),
        )
    }

    @Test
    fun `tells the town becoming a city`() {
        assertEquals("Tu pueblo ahora es una ciudad.", resources.newsLineOf(TownNews.BecameCity(at)))
    }

    @Test
    fun `reads the pay of a job back`() {
        val pay: List<TownAmount> = listOf(TownAmount(TownResourceKind.Food, 40))

        assertEquals("Pago: 40 de comida", resources.payLineOf(TownNews.JobBack(at, site, pay)))
    }

    @Test
    fun `reads the pay of a job called back`() {
        val pay: List<TownAmount> = listOf(TownAmount(TownResourceKind.Food, 40))

        assertEquals("Pago: 40 de comida", resources.payLineOf(TownNews.JobCalledBack(at, site, pay)))
    }

    @Test
    fun `reads the reward of a clean-up as its pay`() {
        val reward: List<TownAmount> = listOf(TownAmount(TownResourceKind.Food, 40))

        assertEquals("Pago: 40 de comida", resources.payLineOf(TownNews.CleanUpDone(at, site, reward)))
    }

    @Test
    fun `joins two amounts with a conjunction`() {
        val pay: List<TownAmount> = listOf(TownAmount(TownResourceKind.Money, 1), TownAmount(TownResourceKind.Food, 2))

        assertEquals("Pago: 1 de dinero y 2 de comida", resources.payLineOf(TownNews.JobBack(at, site, pay)))
    }

    @Test
    fun `joins three amounts in the order given`() {
        val pay: List<TownAmount> = listOf(
            TownAmount(TownResourceKind.Money, 1),
            TownAmount(TownResourceKind.Power, 2),
            TownAmount(TownResourceKind.Material, 3),
        )

        assertEquals(
            "Pago: 1 de dinero, 2 de energía y 3 de material",
            resources.payLineOf(TownNews.JobBack(at, site, pay)),
        )
    }

    @Test
    fun `groups a large amount with a thin space`() {
        val pay: List<TownAmount> = listOf(TownAmount(TownResourceKind.Money, 12500))

        assertEquals("Pago: 12 500 de dinero", resources.payLineOf(TownNews.JobBack(at, site, pay)))
    }

    @Test
    fun `reads no pay for a job that brought nothing`() {
        assertNull(resources.payLineOf(TownNews.JobBack(at, site, pay = emptyList())))
    }

    @Test
    fun `reads no pay for news that carry none`() {
        assertNull(resources.payLineOf(TownNews.BecameCity(at)))
    }

    @Test
    fun `dates news of the day of the read as today`() {
        val readAt: Instant = Instant.parse("2026-11-05T20:00:00Z")

        assertEquals("Hoy, 09:56", resources.instantLabelOf(at, readAt, lima))
    }

    @Test
    fun `dates news of the same local day across the UTC midnight as today`() {
        val occurred: Instant = Instant.parse("2026-11-06T04:30:00Z")
        val readAt: Instant = Instant.parse("2026-11-05T15:00:00Z")

        assertEquals("Hoy, 23:30", resources.instantLabelOf(occurred, readAt, lima))
    }

    @Test
    fun `dates news of another day of the year with its day`() {
        val readAt: Instant = Instant.parse("2026-11-07T20:00:00Z")

        assertEquals("5 nov, 09:56", resources.instantLabelOf(at, readAt, lima))
    }

    @Test
    fun `dates news of another year with their year`() {
        val readAt: Instant = Instant.parse("2027-01-02T20:00:00Z")

        assertEquals("5 nov 2026, 09:56", resources.instantLabelOf(at, readAt, lima))
    }
}
