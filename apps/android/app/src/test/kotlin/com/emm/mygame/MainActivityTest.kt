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
    fun `draws in Spanish on an English phone, since every player's scaffold is es`() {
        val activity: MainActivity = Robolectric.buildActivity(MainActivity::class.java).setup().get()

        assertEquals("Pueblo", activity.getString(R.string.navigation_town))
    }
}
