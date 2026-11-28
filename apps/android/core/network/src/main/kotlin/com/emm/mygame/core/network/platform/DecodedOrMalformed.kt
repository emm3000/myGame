package com.emm.mygame.core.network.platform

import java.time.DateTimeException
import kotlinx.serialization.SerializationException

internal inline fun <Decoded> decodedOrMalformed(decode: () -> Decoded): Decoded =
    try {
        decode()
    } catch (malformedBody: IllegalArgumentException) {
        throw malformedBody as? SerializationException ?: SerializationException(malformedBody.message, malformedBody)
    } catch (malformedBody: DateTimeException) {
        throw SerializationException(malformedBody.message, malformedBody)
    }
