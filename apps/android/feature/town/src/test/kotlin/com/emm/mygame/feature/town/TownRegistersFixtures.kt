package com.emm.mygame.feature.town

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import com.emm.mygame.core.designsystem.control.MyGameRegistering
import com.emm.mygame.core.designsystem.control.REGISTERING
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.registeredBetween
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import kotlin.time.Duration

internal fun showBetween(
    composeRule: ComposeContentTestRule,
    previous: TownSnapshot,
    next: TownSnapshot,
    place: TownBuildingKind,
) {
    val registered: TownRegistered = registeredBetween(previous, next)
    composeRule.setContent {
        MyGameTheme {
            TownScreen(
                place = place,
                onPlaceOpen = {},
                onNewsOpen = {},
                state = next.contentAt(
                    now = readInstant,
                    gap = Duration.ZERO,
                    requests = TownRequests.none,
                    registered = registered,
                    hiringEntries = emptyMap(),
                    closed = ClosedGuidance.none,
                ),
                onIntent = { },
                onSchoolOpen = { },
                onMapOpen = {},
            )
        }
    }
}

internal fun registeringNodesOf(composeRule: ComposeContentTestRule): List<MyGameRegistering> =
    composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
        .fetchSemanticsNodes()
        .map { node -> node.config[REGISTERING] }
