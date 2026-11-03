package com.emm.mygame.core.testing

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.CancelResult
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.MarchDispatch
import com.emm.mygame.core.network.MarchResult
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.RecruitResult
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UpgradeResult
import kotlin.time.Instant
import kotlinx.coroutines.channels.Channel

class FakeFiefRepository : FiefRepository {

    private val answers: Channel<FiefReadResult> = Channel(Channel.UNLIMITED)

    private val _reads: MutableList<FiefId> = mutableListOf()

    private val upgradeAnswers: Channel<UpgradeResult> = Channel(Channel.UNLIMITED)

    private val cancelAnswers: Channel<CancelResult> = Channel(Channel.UNLIMITED)

    private val studyAnswers: Channel<StudyResult> = Channel(Channel.UNLIMITED)

    private val _studies: MutableList<StudyRequest> = mutableListOf()

    private val recruitAnswers: Channel<RecruitResult> = Channel(Channel.UNLIMITED)

    private val _recruits: MutableList<RecruitRequest> = mutableListOf()

    private val marchAnswers: Channel<MarchResult> = Channel(Channel.UNLIMITED)

    private val _marches: MutableList<MarchRequest> = mutableListOf()

    private val _upgrades: MutableList<Pair<FiefId, BuildingKind>> = mutableListOf()

    private val _cancels: MutableList<CancelRequest> = mutableListOf()

    val reads: List<FiefId>
        get() = _reads.toList()

    val readCount: Int
        get() = _reads.size

    val upgrades: List<Pair<FiefId, BuildingKind>>
        get() = _upgrades.toList()

    val cancels: List<CancelRequest>
        get() = _cancels.toList()

    val studies: List<StudyRequest>
        get() = _studies.toList()

    val recruits: List<RecruitRequest>
        get() = _recruits.toList()

    val marches: List<MarchRequest>
        get() = _marches.toList()

    fun answerMarch(result: MarchResult) {
        marchAnswers.trySend(result)
    }

    fun answerRecruit(result: RecruitResult) {
        recruitAnswers.trySend(result)
    }

    fun answerStudy(result: StudyResult) {
        studyAnswers.trySend(result)
    }

    fun answerRead(result: FiefReadResult) {
        answers.trySend(result)
    }

    fun answerUpgrade(result: UpgradeResult) {
        upgradeAnswers.trySend(result)
    }

    fun answerCancel(result: CancelResult) {
        cancelAnswers.trySend(result)
    }

    override suspend fun read(fief: FiefId): FiefReadResult {
        _reads += fief
        return answers.receive()
    }

    override suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult {
        _upgrades += fief to building
        return upgradeAnswers.receive()
    }

    override suspend fun cancel(fief: FiefId, building: BuildingKind, targetLevel: Int): CancelResult {
        _cancels += CancelRequest(fief, building, targetLevel)
        return cancelAnswers.receive()
    }

    override suspend fun startStudy(fief: FiefId, art: ArtKind): StudyResult {
        _studies += StudyRequest.Start(fief, art)
        return studyAnswers.receive()
    }

    override suspend fun cancelStudy(fief: FiefId, art: ArtKind, targetLevel: Int): StudyResult {
        _studies += StudyRequest.Cancel(fief, art, targetLevel)
        return studyAnswers.receive()
    }

    override suspend fun recruit(fief: FiefId, unit: UnitKind, count: Int): RecruitResult {
        _recruits += RecruitRequest.Place(fief, unit, count)
        return recruitAnswers.receive()
    }

    override suspend fun cancelRecruit(fief: FiefId, unit: UnitKind, startedAt: Instant): RecruitResult {
        _recruits += RecruitRequest.Cancel(fief, unit, startedAt)
        return recruitAnswers.receive()
    }

    override suspend fun dispatch(fief: FiefId, march: MarchDispatch): MarchResult {
        _marches += when (march) {
            is MarchDispatch.Forage -> MarchRequest.Forage(fief, march.target, march.party, march.stayHours)
            is MarchDispatch.Attack -> MarchRequest.Attack(fief, march.target, march.party)
            is MarchDispatch.Found -> MarchRequest.Found(fief, march.target, march.name)
            is MarchDispatch.Transport -> MarchRequest.Transport(fief, march.destination, march.party, march.cargo)
        }
        return marchAnswers.receive()
    }

    override suspend fun recall(fief: FiefId, departedAt: Instant): MarchResult {
        _marches += MarchRequest.Recall(fief, departedAt)
        return marchAnswers.receive()
    }

    sealed interface MarchRequest {

        data class Forage(
            val fief: FiefId,
            val target: PlotAddress,
            val party: List<UnitCount>,
            val stayHours: Int,
        ) : MarchRequest

        data class Attack(val fief: FiefId, val target: PlotAddress, val party: List<UnitCount>) : MarchRequest

        data class Found(val fief: FiefId, val target: PlotAddress, val name: String) : MarchRequest

        data class Transport(
            val fief: FiefId,
            val destination: FiefId,
            val party: List<UnitCount>,
            val cargo: List<ResourceQuantity>,
        ) : MarchRequest

        data class Recall(val fief: FiefId, val departedAt: Instant) : MarchRequest
    }

    sealed interface RecruitRequest {

        data class Place(val fief: FiefId, val unit: UnitKind, val count: Int) : RecruitRequest

        data class Cancel(val fief: FiefId, val unit: UnitKind, val startedAt: Instant) : RecruitRequest
    }

    sealed interface StudyRequest {

        data class Start(val fief: FiefId, val art: ArtKind) : StudyRequest

        data class Cancel(val fief: FiefId, val art: ArtKind, val targetLevel: Int) : StudyRequest
    }

    data class CancelRequest(val fief: FiefId, val building: BuildingKind, val targetLevel: Int)
}
