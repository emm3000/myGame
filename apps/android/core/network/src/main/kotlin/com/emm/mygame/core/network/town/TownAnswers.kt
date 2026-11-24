package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.network.account.LanguageAnswer
import com.emm.mygame.core.network.account.LanguageRead
import com.emm.mygame.core.network.account.PlayerLanguages
import com.emm.mygame.core.network.account.ScaffoldVersion
import com.emm.mygame.core.network.account.toPlayerChromePhase
import com.emm.mygame.core.network.account.toPlayerScaffold
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.platform.TokenStore
import com.emm.mygame.core.network.reminder.StudyAnswers
import com.emm.mygame.core.network.reminder.StudyRequest
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
