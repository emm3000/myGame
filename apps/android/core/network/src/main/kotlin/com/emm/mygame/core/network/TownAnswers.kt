package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.TownOverview
import retrofit2.Response

internal class TownAnswers(private val languages: PlayerLanguages, private val studyAnswers: StudyAnswers) {

    fun sending(): TownRequest = TownRequest(language = languages.sending(), study = studyAnswers.sending())

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

internal data class TownRequest(val language: LanguageRead, val study: StudyRequest)
