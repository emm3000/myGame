package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.R as DesignSystemR
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.xmlpull.v1.XmlPullParser

private const val ANDROID_NAMESPACE: String = "http://schemas.android.com/apk/res/android"
private const val ON_BLOCK: Int = 0xFF15141A.toInt()

@RunWith(RobolectricTestRunner::class)
class WordArtTest {

    @Test
    fun `draws a word's silhouette in on-block with no windows`() {
        val art: MyGameArt? = wordArtOf("station")

        assertEquals(MyGameArtTint.OnBlock to 0, art?.tint to art?.let(::windowsOf))
    }

    @Test
    fun `draws each of the seven words with the silhouette of its place`() {
        val drawables: List<Int?> = listOf("home", "farm", "factory", "station", "storage", "school", "office")
            .map { word: String -> wordArtOf(word)?.drawable }

        assertEquals(
            listOf(
                DesignSystemR.drawable.designsystem_place_homes_0,
                DesignSystemR.drawable.designsystem_place_farm_0,
                DesignSystemR.drawable.designsystem_place_factory_0,
                DesignSystemR.drawable.designsystem_place_power_station_0,
                DesignSystemR.drawable.designsystem_place_storage_0,
                DesignSystemR.drawable.designsystem_place_school_0,
                DesignSystemR.drawable.designsystem_place_office_0,
            ),
            drawables,
        )
    }

    @Test
    fun `leaves every other word without art`() {
        assertNull(wordArtOf("money"))
    }

    private fun windowsOf(art: MyGameArt): Int {
        val parser = RuntimeEnvironment.getApplication().resources.getXml(art.drawable)
        var windows = 0
        while (parser.next() != XmlPullParser.END_DOCUMENT) {
            val isPath: Boolean = parser.eventType == XmlPullParser.START_TAG && parser.name == "path"
            if (isPath && parser.getAttributeIntValue(ANDROID_NAMESPACE, "fillColor", 0) == ON_BLOCK) windows += 1
        }
        return windows
    }
}
