package com.emm.mygame

import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class MainActivityTest {

    @Test
    @Config(qualifiers = "en")
    fun `reads English on an English phone before any player is read`() {
        val activity: MainActivity = Robolectric.buildActivity(MainActivity::class.java).setup().get()

        assertEquals("Town", activity.getString(R.string.navigation_town))
    }

    @Test
    @Config(qualifiers = "es")
    fun `reads Spanish on a Spanish phone before any player is read`() {
        val activity: MainActivity = Robolectric.buildActivity(MainActivity::class.java).setup().get()

        assertEquals("Pueblo", activity.getString(R.string.navigation_town))
    }
}
