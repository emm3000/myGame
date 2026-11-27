package com.emm.mygame.feature.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fitInside
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.union
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.WindowInsetsRulers
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBackLink
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn
import com.emm.mygame.feature.shell.ring.RetainedWordsRing

@Composable
fun FramedScreen(
    kind: FrameKind,
    towns: TownReader,
    navigation: ShellNavigation,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val framedInsets: WindowInsets =
        if (kind == FrameKind.Home) WindowInsets.ime else WindowInsets.ime.union(WindowInsets.statusBars)
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .semantics { isTraversalGroup = true },
    ) {
        when (kind) {
            FrameKind.Home -> Unit
            FrameKind.Place -> FrameHeader(navigation = navigation) {
                RetainedWordsRing(towns = towns, doesScreenReadTown = true)
            }
            FrameKind.Door, FrameKind.Task -> FrameHeader(navigation = navigation)
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .fitInside(WindowInsetsRulers.Ime.current)
                .consumeWindowInsets(framedInsets),
        ) {
            content()
        }
    }
}

@Composable
private fun FrameHeader(navigation: ShellNavigation, ring: @Composable () -> Unit = {}) {
    MyGameHeader(
        modifier = Modifier
            .statusBarsPadding()
            .padding(horizontal = MyGameSpacing.step4)
            .frameHeaderTurn(),
        end = ring,
    ) {
        if (navigation.isOnTabRoot) return@MyGameHeader
        MyGameBackLink(
            label = chromeResource(navigation.tabUnder.label),
            isEnabled = navigation.areLinksEnabled,
            onClick = { navigation.onTabOpen(navigation.tabUnder) },
        )
    }
}
