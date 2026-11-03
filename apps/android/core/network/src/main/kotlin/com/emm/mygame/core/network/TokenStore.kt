package com.emm.mygame.core.network

import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.ProviderException

class TokenStore(private val file: File, private val cipher: TokenCipher) {

    private val lock: Any = Any()

    private var isErased: Boolean = false

    internal fun read(): String? = synchronized(lock) {
        if (isErased || !file.exists()) return null
        try {
            cipher.decrypt(file.readBytes()).decodeToString()
        } catch (expectedLostKey: GeneralSecurityException) {
            forgotten()
        } catch (expectedShortCiphertext: IllegalArgumentException) {
            forgotten()
        } catch (expectedProviderFailure: ProviderException) {
            forgotten()
        }
    }

    private fun forgotten(): String? {
        erase()
        return null
    }

    internal fun write(token: String) {
        synchronized(lock) {
            val staging: File = File(file.parentFile, "${file.name}.staging")
            staging.writeBytes(cipher.encrypt(token.encodeToByteArray()))
            if (!staging.renameTo(file)) throw IOException("Could not replace the stored session")
            isErased = false
        }
    }

    internal fun clear() {
        synchronized(lock) {
            erase()
        }
    }

    internal fun clearIfHolding(token: String): Boolean = synchronized(lock) {
        if (read() != token) return false
        erase()
        true
    }

    private fun erase() {
        if (file.delete() || !file.exists()) return
        isErased = true
        try {
            file.writeBytes(ByteArray(0))
        } catch (expectedReadOnlyFile: IOException) {
        }
    }
}
