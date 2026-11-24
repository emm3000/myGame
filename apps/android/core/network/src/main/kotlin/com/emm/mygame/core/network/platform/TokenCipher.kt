package com.emm.mygame.core.network.platform

interface TokenCipher {

    fun encrypt(plain: ByteArray): ByteArray

    fun decrypt(sealed: ByteArray): ByteArray
}
