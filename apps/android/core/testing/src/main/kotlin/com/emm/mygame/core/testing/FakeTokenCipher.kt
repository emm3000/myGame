package com.emm.mygame.core.testing

import com.emm.mygame.core.network.TokenCipher
import kotlin.experimental.xor

class FakeTokenCipher(
    private val encryptFailure: Exception? = null,
    private val decryptFailure: Exception? = null,
) : TokenCipher {

    override fun encrypt(plain: ByteArray): ByteArray {
        if (encryptFailure != null) throw encryptFailure
        return ByteArray(NONCE_BYTES) + plain.map { it xor MASK }.toByteArray()
    }

    override fun decrypt(sealed: ByteArray): ByteArray {
        if (decryptFailure != null) throw decryptFailure
        return sealed.copyOfRange(NONCE_BYTES, sealed.size).map { it xor MASK }.toByteArray()
    }

    private companion object {
        const val MASK: Byte = 0x5A
        const val NONCE_BYTES: Int = 12
    }
}
