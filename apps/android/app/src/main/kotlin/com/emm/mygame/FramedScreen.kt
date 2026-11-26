package com.emm.mygame

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
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.frameHeaderTurn

@Composable
internal fun FramedScreen(
    kind: FrameKind,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
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
        if (kind != FrameKind.Home) FrameHeader(doesScreenReadTown = doesScreenReadTown, chrome = chrome)
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
private fun FrameHeader(doesScreenReadTown: Boolean, chrome: SignedInChrome) {
    MyGameHeader(
        modifier = Modifier
            .statusBarsPadding()
            .padding(horizontal = MyGameSpacing.step4)
            .frameHeaderTurn(),
        end = { RetainedWordsRing(towns = chrome.dependencies.towns, doesScreenReadTown = doesScreenReadTown) },
    ) {
        if (chrome.navigator.isOnTabRoot) return@MyGameHeader
        MyGameBackLink(
            label = chromeResource(chrome.navigator.tabUnder.label),
            isEnabled = chrome.navigator.areLinksEnabled,
            onClick = { chrome.navigator.openTab(chrome.navigator.tabUnder) },
        )
    }
}
