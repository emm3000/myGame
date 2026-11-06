package com.emm.mygame.core.designsystem

import org.junit.Assert.assertEquals
import org.junit.Test

class MyGameBlockHueTest {

    @Test
    fun `walks the four hues in the order of the look`() {
        val hues: List<MyGameBlockHue> = (0..3).map(::blockHueOf)

        assertEquals(
            listOf(
                MyGameBlockHue.Peach,
                MyGameBlockHue.Mint,
                MyGameBlockHue.Periwinkle,
                MyGameBlockHue.Lavender,
            ),
            hues,
        )
    }

    @Test
    fun `starts the hues again at the fifth place`() {
        assertEquals(MyGameBlockHue.Peach, blockHueOf(4))
    }
}
