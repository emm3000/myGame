package com.emm.mygame.core.network

import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.ProviderException

class TokenStore(private val file: File, private val cipher: TokenCipher) {

    private val lock: Any = Any()

    internal fun read(): String? = synchronized(lock) {
        if (!file.exists()) return null
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
        file.delete()
        return null
    }

    internal fun write(token: String) {
        synchronized(lock) {
            val staging: File = File(file.parentFile, "${file.name}.staging")
            staging.writeBytes(cipher.encrypt(token.encodeToByteArray()))
            if (!staging.renameTo(file)) throw IOException("Could not replace the stored session")
        }
    }

    internal fun clear() {
        synchronized(lock) {
            file.delete()
        }
    }
}
