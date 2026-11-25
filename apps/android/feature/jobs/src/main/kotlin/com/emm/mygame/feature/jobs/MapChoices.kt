package com.emm.mygame.feature.jobs

internal data class MapChoices(
    val chosen: Int?,
    val entries: JobEntries,
    val send: MapUiState.SendRequest,
    val callBack: MapUiState.CallBackRequest,
) {

    fun keptAfterRead(): MapChoices = copy(
        send = unansweredSend(),
        callBack = if (callBack == MapUiState.CallBackRequest.Waiting) callBack else MapUiState.CallBackRequest.Idle,
    )

    fun closed(): MapChoices = keptAfterRead().copy(chosen = null, entries = JobEntries.first)

    fun choosing(site: Int): MapChoices = copy(
        chosen = if (chosen == site) null else site,
        entries = JobEntries.first,
        send = unansweredSend(),
    )

    fun entering(field: MapIntent.JobField, entry: String): MapChoices =
        copy(entries = entries.with(field, entry), send = unansweredSend())

    private fun unansweredSend(): MapUiState.SendRequest =
        if (send == MapUiState.SendRequest.Waiting) send else MapUiState.SendRequest.Idle

    companion object {
        val none: MapChoices = MapChoices(
            chosen = null,
            entries = JobEntries.first,
            send = MapUiState.SendRequest.Idle,
            callBack = MapUiState.CallBackRequest.Idle,
        )
    }
}
