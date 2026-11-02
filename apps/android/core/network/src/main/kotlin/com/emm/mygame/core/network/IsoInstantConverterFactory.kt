package com.emm.mygame.core.network

import java.lang.reflect.Type
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import retrofit2.Converter
import retrofit2.Retrofit

internal class IsoInstantConverterFactory : Converter.Factory() {

    private val isoInstant: Converter<OffsetDateTime, String> = Converter { instant: OffsetDateTime ->
        instant.withOffsetSameInstant(ZoneOffset.UTC).format(millisecondInstant)
    }

    override fun stringConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<*, String>? = if (type == OffsetDateTime::class.java) isoInstant else null

    private companion object {
        val millisecondInstant: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    }
}
