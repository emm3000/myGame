package com.emm.mygame.core.network

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class KeystoreTokenCipher(private val keyAlias: String) : TokenCipher {

    override fun encrypt(plain: ByteArray): ByteArray {
        val cipher: Cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key())
        return cipher.iv + cipher.doFinal(plain)
    }

    override fun decrypt(sealed: ByteArray): ByteArray {
        val cipher: Cipher = Cipher.getInstance(TRANSFORMATION)
        val nonce: GCMParameterSpec = GCMParameterSpec(TAG_BITS, sealed, 0, NONCE_BYTES)
        cipher.init(Cipher.DECRYPT_MODE, key(), nonce)
        return cipher.doFinal(sealed, NONCE_BYTES, sealed.size - NONCE_BYTES)
    }

    private fun key(): SecretKey {
        val keyStore: KeyStore = KeyStore.getInstance(KEY_STORE).apply { load(null) }
        return keyStore.getKey(keyAlias, null) as? SecretKey ?: generatedKey()
    }

    private fun generatedKey(): SecretKey {
        val spec: KeyGenParameterSpec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(KEY_BITS)
            .build()
        val generator: KeyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEY_STORE)
        generator.init(spec)
        return generator.generateKey()
    }

    private companion object {
        const val KEY_STORE: String = "AndroidKeyStore"
        const val TRANSFORMATION: String = "AES/GCM/NoPadding"
        const val KEY_BITS: Int = 256
        const val TAG_BITS: Int = 128
        const val NONCE_BYTES: Int = 12
    }
}
