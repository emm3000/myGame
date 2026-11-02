package com.emm.mygame.core.network

interface TokenCipher {

    fun encrypt(plain: ByteArray): ByteArray

    fun decrypt(sealed: ByteArray): ByteArray
}
