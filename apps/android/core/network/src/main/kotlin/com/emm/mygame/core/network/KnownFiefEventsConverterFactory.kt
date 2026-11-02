package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.ArtLearnedEvent
import com.emm.mygame.core.network.generated.models.BattleFoughtEvent
import com.emm.mygame.core.network.generated.models.FiefChronicle
import com.emm.mygame.core.network.generated.models.FiefFoundedEvent
import com.emm.mygame.core.network.generated.models.FoundingSentEvent
import com.emm.mygame.core.network.generated.models.MarchReturnedEvent
import com.emm.mygame.core.network.generated.models.RecruitsCancelledEvent
import com.emm.mygame.core.network.generated.models.RecruitsDeliveredEvent
import com.emm.mygame.core.network.generated.models.StudyCancelledEvent
import com.emm.mygame.core.network.generated.models.TransportArrivedEvent
import com.emm.mygame.core.network.generated.models.TransportSentEvent
import com.emm.mygame.core.network.generated.models.UpgradeCancelledEvent
import com.emm.mygame.core.network.generated.models.UpgradeFinishedEvent
import java.lang.reflect.Type
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.ResponseBody
import retrofit2.Converter
import retrofit2.Retrofit

internal class KnownFiefEventsConverterFactory(private val json: Json) : Converter.Factory() {

    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<ResponseBody, *>? =
        if (type == FiefChronicle::class.java) Converter(::decodeChronicle) else null

    private fun decodeChronicle(body: ResponseBody): FiefChronicle {
        val chronicle: JsonObject = body.use { json.parseToJsonElement(it.string()) } as? JsonObject
            ?: throw SerializationException("A chronicle is a JSON object")
        val events: JsonArray = chronicle[EVENTS] as? JsonArray
            ?: throw SerializationException("A chronicle lists events")
        val knownEvents: JsonArray = JsonArray(events.filterNot(::isOfUnknownKind))
        return json.decodeFromJsonElement(FiefChronicle.serializer(), JsonObject(chronicle + (EVENTS to knownEvents)))
    }

    private fun isOfUnknownKind(event: JsonElement): Boolean {
        val kind: JsonPrimitive = (event as? JsonObject)?.get(KIND) as? JsonPrimitive ?: return false
        return kind.isString && kind.content !in knownKinds
    }

    private companion object {
        const val EVENTS: String = "events"
        const val KIND: String = "kind"

        val knownKinds: Set<String> = setOf(
            UpgradeFinishedEvent.Kind.upgradeFinished.value,
            ArtLearnedEvent.Kind.artLearned.value,
            UpgradeCancelledEvent.Kind.upgradeCancelled.value,
            StudyCancelledEvent.Kind.studyCancelled.value,
            RecruitsDeliveredEvent.Kind.recruitsDelivered.value,
            RecruitsCancelledEvent.Kind.recruitsCancelled.value,
            MarchReturnedEvent.Kind.marchReturned.value,
            BattleFoughtEvent.Kind.battleFought.value,
            FoundingSentEvent.Kind.foundingSent.value,
            FiefFoundedEvent.Kind.fiefFounded.value,
            TransportSentEvent.Kind.transportSent.value,
            TransportArrivedEvent.Kind.transportArrived.value,
        )
    }
}
