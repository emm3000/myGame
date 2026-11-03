package com.emm.mygame.core.network

sealed interface PlotHolder {

    data object Free : PlotHolder

    data class Held(val name: String) : PlotHolder

    data class Own(val name: String, val fief: FiefId?) : PlotHolder

    data class Camp(val tier: Int, val strength: Int) : PlotHolder

    data class Reserved(val isOwn: Boolean) : PlotHolder
}
