package com.emm.mygame.core.uitesting

import androidx.compose.ui.test.SemanticsNodeInteractionsProvider
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameLabel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue

const val TAB_RING_LABEL: String = "0 de 5 palabras aprendidas"

private const val HALF_PIXEL: Float = 0.5f

val tabRingLabel: MyGameLabel = MyGameLabel(text = TAB_RING_LABEL, translation = null)

fun assertRingOnTitleRow(nodes: SemanticsNodeInteractionsProvider, title: String) {
    val heading: DpRect = nodes.onNode(isHeading() and hasText(title)).getUnclippedBoundsInRoot()
    val ring: DpRect = nodes.onNode(hasText(TAB_RING_LABEL)).getUnclippedBoundsInRoot()
    assertTrue("the ring sits after the title", ring.left >= heading.right)
    assertEquals((heading.top + heading.bottom).value, (ring.top + ring.bottom).value, HALF_PIXEL)
}
