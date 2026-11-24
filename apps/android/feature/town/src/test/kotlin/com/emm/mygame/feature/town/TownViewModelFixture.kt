package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import org.junit.Rule
import kotlin.time.Instant

abstract class TownViewModelFixture {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    protected val towns: FakeTownRepository = FakeTownRepository()

    protected fun TestScope.namingViewModel(start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.NoTown)
        return viewModelOf(start)
    }

    protected fun TestScope.homeViewModel(town: TownSnapshot, start: Instant = readInstant): TownViewModel {
        towns.answerRead(TownReadResult.Read(town))
        return viewModelOf(start)
    }

    protected fun risingTownReadAt(readAt: Instant): TownSnapshot = townOf(
        stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)),
        readAt = readAt,
    )

    protected fun TestScope.viewModelOf(start: Instant = readInstant): TownViewModel =
        townViewModelOf(towns, start)

    protected companion object {
        const val OUTAGE_READS: Int = 200
    }
}
