package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BecameCityNews
import com.emm.mygame.core.network.generated.models.BuildingWorkFinishedNews
import com.emm.mygame.core.network.generated.models.BuildingWorkStoppedNews
import com.emm.mygame.core.network.generated.models.CleanUpDoneNews
import com.emm.mygame.core.network.generated.models.CleanUpFailedNews
import com.emm.mygame.core.network.generated.models.HiringDeliveredNews
import com.emm.mygame.core.network.generated.models.HiringStoppedNews
import com.emm.mygame.core.network.generated.models.JobBackNews
import com.emm.mygame.core.network.generated.models.JobCalledBackNews
import com.emm.mygame.core.network.generated.models.LessonStoppedNews
import com.emm.mygame.core.network.generated.models.LessonStudiedNews
import com.emm.mygame.core.network.generated.models.Report
import com.emm.mygame.core.network.generated.models.SkillEarnedNews
import com.emm.mygame.core.network.generated.models.TownNewsFeed
import java.lang.reflect.Type
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.ResponseBody
import retrofit2.Converter
import retrofit2.Retrofit

internal class KnownTownNewsConverterFactory(private val json: Json) : Converter.Factory() {

    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<ResponseBody, *>? = when (type) {
        Report::class.java -> Converter { body: ResponseBody -> decode(body, Report.serializer(), NEWS) }
        TownNewsFeed::class.java -> Converter { body: ResponseBody -> decode(body, TownNewsFeed.serializer(), ITEMS) }
        else -> null
    }

    private fun <Body> decode(body: ResponseBody, serializer: KSerializer<Body>, listed: String): Body {
        val answer: JsonObject = body.use { json.parseToJsonElement(it.string()) } as? JsonObject
            ?: throw SerializationException("A body that lists news is a JSON object")
        val news: JsonArray = answer[listed] as? JsonArray
            ?: throw SerializationException("A body that lists news holds them in $listed")
        val knownNews: JsonArray = JsonArray(news.filterNot(::isOfUnknownKind))
        return json.decodeFromJsonElement(serializer, JsonObject(answer + (listed to knownNews)))
    }

    private fun isOfUnknownKind(item: JsonElement): Boolean {
        val kind: JsonPrimitive = (item as? JsonObject)?.get(KIND) as? JsonPrimitive ?: return false
        return kind.isString && kind.content !in knownKinds
    }

    private companion object {
        const val NEWS: String = "news"
        const val ITEMS: String = "items"
        const val KIND: String = "kind"

        val knownKinds: Set<String> = setOf(
            BuildingWorkFinishedNews.Kind.buildingWorkFinished.value,
            BuildingWorkStoppedNews.Kind.buildingWorkStopped.value,
            LessonStudiedNews.Kind.lessonStudied.value,
            LessonStoppedNews.Kind.lessonStopped.value,
            SkillEarnedNews.Kind.skillEarned.value,
            HiringDeliveredNews.Kind.hiringDelivered.value,
            HiringStoppedNews.Kind.hiringStopped.value,
            JobBackNews.Kind.jobBack.value,
            JobCalledBackNews.Kind.jobCalledBack.value,
            CleanUpDoneNews.Kind.cleanUpDone.value,
            CleanUpFailedNews.Kind.cleanUpFailed.value,
            BecameCityNews.Kind.becameCity.value,
        )
    }
}
