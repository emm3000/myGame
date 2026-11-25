package com.emm.mygame.core.model.town

sealed interface ReadAnswer<out T> {

    data class Read<T>(val read: T) : ReadAnswer<T>

    data object Ended : ReadAnswer<Nothing>

    data object Unreachable : ReadAnswer<Nothing>
}
