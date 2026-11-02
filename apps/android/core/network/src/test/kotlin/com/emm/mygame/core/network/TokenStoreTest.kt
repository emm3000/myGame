package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeTokenCipher
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
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
        val storeWithLostKey: TokenStore = TokenStore(file, FakeTokenCipher(isKeyLost = true))

        assertNull(storeWithLostKey.read())
    }

    private fun sessionFile(): File = File(folder.root, "session")
}
