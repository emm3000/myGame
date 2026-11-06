package com.emm.mygame.core.designsystem

import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.junit.Assert.assertEquals
import org.junit.Test

class WordStyleTest {

    @Test
    fun `sets the word at 44 sp below the md width`() {
        assertEquals(44.sp, wordStyleAt(767.dp).fontSize)
    }

    @Test
    fun `sets the word at 52 sp from the md width`() {
        assertEquals(52.sp, wordStyleAt(768.dp).fontSize)
    }
}
