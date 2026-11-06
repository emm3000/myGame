package com.emm.mygame

import com.emm.mygame.core.network.ChronicleRepository
import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.MapRepository
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownRepository
import kotlin.time.Clock

interface AppDependencies {

    val clock: Clock

    val sessionEnds: SessionEnds

    val sessions: SessionRepository

    val listings: FiefListRepository

    val fiefs: FiefRepository

    val towns: TownRepository

    val learning: LearningRepository

    val reports: ReportRepository

    val maps: MapRepository

    val chronicles: ChronicleRepository
}
