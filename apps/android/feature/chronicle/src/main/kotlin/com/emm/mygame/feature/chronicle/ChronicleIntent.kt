package com.emm.mygame.feature.chronicle

sealed interface ChronicleIntent {

    data object RetryTapped : ChronicleIntent
}
