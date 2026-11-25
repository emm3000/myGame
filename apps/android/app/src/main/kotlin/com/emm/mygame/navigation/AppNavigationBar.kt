package com.emm.mygame.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameNavigationBar
import com.emm.mygame.core.designsystem.MyGameNavigationItem
import com.emm.mygame.core.designsystem.MyGameNavigationItems
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun AppNavigationBar(
    open: Tab,
    town: TownSnapshot?,
    onTabOpen: (Tab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val reviewsDue: String? = (town?.nextStep as? NextStep.Reviews)?.count?.let { count: Int ->
        formatQuantity(count.toLong())
    }
    MyGameNavigationBar(
        items = MyGameNavigationItems(
            Tab.entries.map { tab: Tab ->
                MyGameNavigationItem(
                    label = copy.chrome(tab.label),
                    icon = tab.icon,
                    isOpen = tab == open,
                    onClick = { onTabOpen(tab) },
                    count = reviewsDue.takeIf { tab == Tab.Learn },
                )
            },
        ),
        modifier = modifier,
    )
}

private val Tab.icon: ImageVector
    get() = when (this) {
        Tab.Today -> MyGameIcons.today
        Tab.Town -> MyGameIcons.town
        Tab.Learn -> MyGameIcons.learn
        Tab.Me -> MyGameIcons.me
    }
