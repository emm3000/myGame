package com.emm.mygame.core.network.platform

import java.lang.reflect.Type
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Converter
import retrofit2.Retrofit

internal class MalformedBodyConverterFactory(private val decoding: Converter.Factory) : Converter.Factory() {

    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<ResponseBody, *>? {
        val decoder: Converter<ResponseBody, *> =
            decoding.responseBodyConverter(type, annotations, retrofit) ?: return null
        return Converter { body: ResponseBody -> decodedOrMalformed { decoder.convert(body) } }
    }

    override fun requestBodyConverter(
        type: Type,
        parameterAnnotations: Array<out Annotation>,
        methodAnnotations: Array<out Annotation>,
        retrofit: Retrofit,
    ): Converter<*, RequestBody>? =
        decoding.requestBodyConverter(type, parameterAnnotations, methodAnnotations, retrofit)
}
