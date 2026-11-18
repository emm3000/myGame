package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.TownOverview
import retrofit2.Response

internal class TownAnswers(
    private val tokenStore: TokenStore,
    private val languages: PlayerLanguages,
    private val studyAnswers: StudyAnswers,
) {

    fun sending(): TownRequest = TownRequest(
        session = tokenStore.currentSession(),
        language = languages.sending(),
        study = studyAnswers.sending(),
    )

    fun isCurrent(request: TownRequest): Boolean = request.session == tokenStore.currentSession()

    fun isNewest(request: TownRequest): Boolean = studyAnswers.isNewest(request.study)

    fun onSessionChange(listener: () -> Unit) {
        tokenStore.onSessionChange(listener)
    }

    fun languageAnswered(request: TownRequest, response: Response<TownOverview>) {
        val town: TownOverview = response.body() ?: return
        languages.answered(
            request.language,
            LanguageAnswer(
                scaffold = town.scaffold.toPlayerScaffold(),
                scaffoldVersion = ScaffoldVersion(town.scaffoldVersion),
                chromePhase = town.chromePhase.toPlayerChromePhase(),
            ),
        )
    }

    fun townAnswered(request: TownRequest, town: TownSnapshot) {
        studyAnswers.townAnswered(request.study, town)
    }
}

internal data class TownRequest(val session: Int, val language: LanguageRead, val study: StudyRequest)
