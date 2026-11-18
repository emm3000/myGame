package com.emm.mygame

import android.content.Context
import android.content.SharedPreferences
import com.emm.mygame.core.network.ThemePick
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ThemeStoreTest {

    private val preferences: SharedPreferences = preferencesFile()

    private val store: ThemeStore = ThemeStore(preferences)

    @Test
    fun `starts on the system theme`() {
        assertEquals(ThemePick.System, store.pick.value)
    }

    @Test
    fun `holds the pick at once`() {
        store.choose(ThemePick.Dark)

        assertEquals(ThemePick.Dark, store.pick.value)
    }

    @Test
    fun `a new store over the same file reads the stored pick`() {
        store.choose(ThemePick.Light)

        val restarted: ThemeStore = ThemeStore(preferencesFile())

        assertEquals(ThemePick.Light, restarted.pick.value)
    }

    @Test
    fun `a stored pick the client does not know reads as the system theme`() {
        preferences.edit().putString("pick", "Sepia").commit()

        val restarted: ThemeStore = ThemeStore(preferencesFile())

        assertEquals(ThemePick.System, restarted.pick.value)
    }

    private fun preferencesFile(): SharedPreferences =
        RuntimeEnvironment.getApplication().getSharedPreferences("theme-test", Context.MODE_PRIVATE)
}
