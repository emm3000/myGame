package com.emm.mygame.feature.town

import android.content.res.XmlResourceParser
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameArtTint
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.xmlpull.v1.XmlPullParser

private const val ANDROID_NAMESPACE: String = "http://schemas.android.com/apk/res/android"
private const val ON_BLOCK: Int = 0xFF15141A.toInt()
private const val PEACH: Int = 0xFFF5C9A8.toInt()
private const val MINT: Int = 0xFFBFE3CB.toInt()
private const val PERIWINKLE: Int = 0xFFC6D3F5.toInt()
private const val LAVENDER: Int = 0xFFDCC8F0.toInt()
private const val ART_TAG: String = "art"
private val drawableWords: Map<TownBuildingKind, String> = mapOf(
    TownBuildingKind.Homes to "homes",
    TownBuildingKind.Farm to "farm",
    TownBuildingKind.School to "school",
    TownBuildingKind.Office to "office",
    TownBuildingKind.Factory to "factory",
    TownBuildingKind.PowerStation to "power_station",
    TownBuildingKind.Storage to "storage",
)

@RunWith(RobolectricTestRunner::class)
class PlaceArtTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun `draws a place not built in surface-sunken with no windows`() {
        val art: MyGameArt = placeArtOf(TownBuildingKind.Factory, level = 0)

        assertEquals(MyGameArtTint.SurfaceSunken to 0, art.tint to windowsOf(art))
    }

    @Test
    fun `takes its hue and one window at level 1`() {
        val art: MyGameArt = placeArtOf(TownBuildingKind.Farm, level = 1)

        assertEquals(
            Triple(MyGameArtTint.None, MINT, 1),
            Triple(art.tint, fillsOf(art).first(), windowsOf(art)),
        )
    }

    @Test
    fun `draws ten windows at level 10`() {
        assertEquals(10, windowsOf(placeArtOf(TownBuildingKind.PowerStation, level = 10)))
    }

    @Test
    fun `adds one window per level`() {
        val levels: List<Int> = (0..10).toList()

        assertEquals(levels, levels.map { level: Int -> windowsOf(placeArtOf(TownBuildingKind.Storage, level)) })
    }

    @Test
    fun `fixes the hue by the place's order`() {
        val order: List<TownBuildingKind> = listOf(
            TownBuildingKind.Homes,
            TownBuildingKind.Farm,
            TownBuildingKind.School,
            TownBuildingKind.Office,
            TownBuildingKind.Factory,
            TownBuildingKind.PowerStation,
            TownBuildingKind.Storage,
        )

        assertEquals(
            listOf(PEACH, MINT, PERIWINKLE, LAVENDER, PEACH, MINT, PERIWINKLE),
            order.map { kind: TownBuildingKind -> fillsOf(placeArtOf(kind, level = 1)).first() },
        )
    }

    @Test
    fun `draws each place from the drawable of its own name at every level`() {
        val levels: IntRange = 0..10
        val expected: List<String> = drawableWords.values.flatMap { word: String ->
            levels.map { level: Int -> "designsystem_place_${word}_$level" }
        }

        val drawn: List<String> = drawableWords.keys.flatMap { kind: TownBuildingKind ->
            levels.map { level: Int -> drawableNameOf(placeArtOf(kind, level)) }
        }

        assertEquals(expected, drawn)
    }

    @Test
    fun `keeps the silhouette at the proportions of its file`() {
        composeRule.setContent {
            MyGameTheme {
                MyGamePlaceArt(
                    art = placeArtOf(TownBuildingKind.School, level = 3),
                    risenFrom = null,
                    modifier = Modifier.testTag(ART_TAG),
                )
            }
        }

        val bounds: DpRect = composeRule.onNodeWithTag(ART_TAG).getUnclippedBoundsInRoot()
        val widthOverHeight: Float = (bounds.right - bounds.left) / (bounds.bottom - bounds.top)

        assertEquals(MyGameSizes.thumbnail, bounds.bottom - bounds.top)
        assertTrue(widthOverHeight in 0.69f..0.72f)
    }

    private fun drawableNameOf(art: MyGameArt): String =
        RuntimeEnvironment.getApplication().resources.getResourceEntryName(art.drawable)

    private fun windowsOf(art: MyGameArt): Int = fillsOf(art).count { fill: Int -> fill == ON_BLOCK }

    private fun fillsOf(art: MyGameArt): List<Int> {
        val parser: XmlResourceParser = RuntimeEnvironment.getApplication().resources.getXml(art.drawable)
        return buildList {
            while (parser.next() != XmlPullParser.END_DOCUMENT) {
                if (parser.eventType == XmlPullParser.START_TAG && parser.name == "path") {
                    add(parser.getAttributeIntValue(ANDROID_NAMESPACE, "fillColor", 0))
                }
            }
        }
    }
}
