package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.time.Duration

@RunWith(RobolectricTestRunner::class)
class TownTipStripTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val homeWithTheTip: TownUiState.Content = townOf().contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        requests = TownRequests.none,
        registered = TownRegistered.nothing,
        hiringEntries = emptyMap(),
        closed = ClosedGuidance.none,
    ).copy(tip = TipKind.People)

    private val tipCard: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.Shape)
        .and(hasAnyDescendant(hasText("Cerrar el consejo")))

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `brings the tip card's bottom edge into view at font scale 2 on a 360 by 640 window`() {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    place = TownBuildingKind.Homes,
                    onPlaceOpen = {},
                    onNewsOpen = {},
                    state = homeWithTheTip,
                    onIntent = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                )
            }
        }

        val card: Dp = composeRule.onAllNodes(tipCard, useUnmergedTree = true).onLast().performScrollTo()
            .getUnclippedBoundsInRoot().bottom
        val window: Dp = composeRule.onRoot().getUnclippedBoundsInRoot().bottom

        assertTrue("the card ending at $card is inside the window ending at $window", card <= window)
    }
}
