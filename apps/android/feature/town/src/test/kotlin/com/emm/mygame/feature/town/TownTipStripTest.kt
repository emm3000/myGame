package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.guidance.TipKind
import kotlin.time.Duration
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class TownTipStripTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val homeWithTheTip: TownUiState.Content = townOf().contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    ).copy(tip = TipKind.People)

    private val tipCard: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.Shape)
        .and(hasAnyDescendant(hasText("Cerrar el consejo")))

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `keeps the tip card's bottom edge above the street strip at font scale 2 on a 360 by 640 window`() {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = homeWithTheTip,
                    onIntent = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                    onTextOpen = {},
                )
            }
        }
        homesTab().performScrollTo().performClick()

        val card: Dp = composeRule.onAllNodes(tipCard, useUnmergedTree = true).onLast().performScrollTo()
            .getUnclippedBoundsInRoot().bottom
        val strip: Dp = homesTab().getUnclippedBoundsInRoot().top

        assertTrue("the card ending at $card is above the strip at $strip", card <= strip)
    }

    private fun homesTab(): SemanticsNodeInteraction =
        composeRule.onNode(isTab and hasContentDescription("Hogares", substring = true))
}
