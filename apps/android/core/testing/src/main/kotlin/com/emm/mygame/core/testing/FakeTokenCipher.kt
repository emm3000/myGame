package com.emm.mygame.core.testing

import com.emm.mygame.core.network.TokenCipher
import java.security.GeneralSecurityException
import kotlin.experimental.xor

class FakeTokenCipher(private val isKeyLost: Boolean = false) : TokenCipher {

    override fun encrypt(plain: ByteArray): ByteArray = plain.map { it xor MASK }.toByteArray()

    override fun decrypt(sealed: ByteArray): ByteArray {
        if (isKeyLost) throw GeneralSecurityException("The key under this ciphertext is gone")
        return sealed.map { it xor MASK }.toByteArray()
    }

    private companion object {
        const val MASK: Byte = 0x5A
    }
}
