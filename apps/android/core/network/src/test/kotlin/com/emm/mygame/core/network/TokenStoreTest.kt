package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import java.security.GeneralSecurityException
import java.security.ProviderException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.After
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class TokenStoreTest {

    @get:Rule
    val folder: TemporaryFolder = TemporaryFolder()

    @Test
    fun `reads back the token it wrote`() {
        val store: TokenStore = TokenStore(sessionFile(), FakeTokenCipher())

        store.write("opaque-session")

        assertEquals("opaque-session", store.read())
    }

    @Test
    fun `keeps only ciphertext on disk`() {
        val file: File = sessionFile()
        val store: TokenStore = TokenStore(file, FakeTokenCipher())

        store.write("opaque-session")

        assertFalse(file.readBytes().decodeToString().contains("opaque-session"))
    }

    @Test
    fun `reads nothing after clear`() {
        val store: TokenStore = TokenStore(sessionFile(), FakeTokenCipher())
        store.write("opaque-session")

        store.clear()

        assertNull(store.read())
    }

    @Test
    fun `reads nothing when the stored ciphertext no longer decrypts`() {
        val file: File = sessionFile()
        TokenStore(file, FakeTokenCipher()).write("opaque-session")
        val lostKey: GeneralSecurityException = GeneralSecurityException("The key under this ciphertext is gone")
        val storeWithLostKey: TokenStore = TokenStore(file, FakeTokenCipher(decryptFailure = lostKey))

        assertNull(storeWithLostKey.read())
    }

    @Test
    fun `forgets a stored ciphertext shorter than its nonce`() {
        val file: File = sessionFile().apply { writeBytes(byteArrayOf(1, 2, 3)) }
        val store: TokenStore = TokenStore(file, FakeTokenCipher())

        assertNull(store.read())
        assertFalse(file.exists())
    }

    @Test
    fun `forgets the stored ciphertext when the keystore provider fails`() {
        val file: File = sessionFile()
        TokenStore(file, FakeTokenCipher()).write("opaque-session")
        val providerFailure: ProviderException = ProviderException("The keystore could not decrypt")
        val storeWithFailingProvider: TokenStore = TokenStore(file, FakeTokenCipher(decryptFailure = providerFailure))

        assertNull(storeWithFailingProvider.read())
        assertFalse(file.exists())
    }

    @Test
    fun `reads nothing after a clear whose delete failed`() {
        val file: File = sessionFile()
        val store: TokenStore = TokenStore(file, FakeTokenCipher())
        store.write("opaque-session")
        file.setWritable(false)
        folder.root.setWritable(false)

        store.clear()

        assertNull(store.read())
    }

    @Test
    fun `leaves no readable token on disk after a clear whose delete failed`() {
        val file: File = sessionFile()
        val store: TokenStore = TokenStore(file, FakeTokenCipher())
        store.write("opaque-session")
        folder.root.setWritable(false)

        store.clear()

        assertNull(TokenStore(file, FakeTokenCipher()).read())
    }

    @Test
    fun `leaves no readable token on disk after forgetting one whose delete failed`() {
        val file: File = sessionFile()
        TokenStore(file, FakeTokenCipher()).write("opaque-session")
        val providerFailure: ProviderException = ProviderException("The keystore could not decrypt")
        val storeWithFailingProvider: TokenStore = TokenStore(file, FakeTokenCipher(decryptFailure = providerFailure))
        folder.root.setWritable(false)

        storeWithFailingProvider.read()

        assertNull(TokenStore(file, FakeTokenCipher()).read())
    }

    @After
    fun restoreWrites() {
        folder.root.setWritable(true)
        sessionFile().setWritable(true)
    }

    private fun sessionFile(): File = File(folder.root, "session")
}
