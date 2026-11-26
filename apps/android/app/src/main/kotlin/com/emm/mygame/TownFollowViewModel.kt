package com.emm.mygame

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.repaintDelay
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.time.Clock
import kotlin.time.Instant

internal class TownFollowViewModel(private val towns: TownRepository, private val clock: Clock) : ViewModel() {

    private var held: HeldTown? = null

    private var isFollowing: Boolean = false

    private var following: Job? = null

    private var reading: Job? = null

    init {
        viewModelScope.launch {
            towns.town.collect { next: HeldTown? ->
                held = next
                restart()
            }
        }
    }

    fun onIntent(intent: TownFollowIntent) {
        when (intent) {
            is TownFollowIntent.ScreenShown -> {
                isFollowing = intent.isLessonFinishFollowed
                restart()
            }
            TownFollowIntent.ScreenHidden -> {
                isFollowing = false
                restart()
            }
            TownFollowIntent.TaskAnswered -> readAnew()
        }
    }

    private fun readAnew() {
        reading?.cancel()
        reading = viewModelScope.launch { towns.readSentAfterNow() }
    }

    private fun readAtFinish() {
        if (reading?.isActive == true) return
        reading = viewModelScope.launch { towns.read() }
    }

    private fun restart() {
        following?.cancel()
        if (!isFollowing || held?.lessonFinishAfterRead() == null) return
        following = viewModelScope.launch { followLessonFinish() }
    }

    private suspend fun followLessonFinish() {
        while (true) {
            val shown: HeldTown = held ?: return
            val finishesAt: Instant = shown.lessonFinishAfterRead() ?: return
            val now: Instant = serverNow(clock, shown.gap)
            if (finishesAt <= now) {
                readAtFinish()
                return
            }
            delay(repaintDelay(finishesAt - now))
        }
    }
}

private fun HeldTown.lessonFinishAfterRead(): Instant? =
    town.lessonSlot?.finishesAt?.takeIf { finishesAt: Instant -> finishesAt > town.readAt }
