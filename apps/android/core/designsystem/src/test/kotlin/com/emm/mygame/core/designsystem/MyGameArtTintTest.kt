package com.emm.mygame.core.designsystem

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MyGameArtTintTest {

    @Test
    fun `keeps the colors of the file without a tint`() {
        assertNull(darkColors.tintOf(MyGameArtTint.None))
    }

    @Test
    fun `tints a place not built with the theme's surface-sunken`() {
        assertEquals(darkColors.surfaceSunken, darkColors.tintOf(MyGameArtTint.SurfaceSunken))
    }

    @Test
    fun `tints a word's silhouette with on-block`() {
        assertEquals(lightColors.onBlock, lightColors.tintOf(MyGameArtTint.OnBlock))
    }

    @Test
    fun `tints a waste silhouette with ink-muted`() {
        assertEquals(darkColors.inkMuted, darkColors.tintOf(MyGameArtTint.InkMuted))
    }
}
