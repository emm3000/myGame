package com.emm.mygame

import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock
import kotlinx.coroutines.flow.StateFlow

interface AppDependencies {

    val clock: Clock

    val sessionEnds: SessionEnds

    val playerLanguage: StateFlow<PlayerLanguage?>

    val sessions: SessionRepository

    val towns: TownRepository

    val learning: LearningRepository

    val reports: ReportRepository

    val placements: PlacementRepository
}
