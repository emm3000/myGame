package com.emm.mygame.navigation

import androidx.navigation3.runtime.rememberNavBackStack
import com.emm.mygame.Destination
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.TownReadResult
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.compose.KoinIsolatedContext
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NamingReadOnOpenNavigationTest : AppNavigationFixture() {

    @Test
    fun `leaves the read on open to the naming screen, which reads the town itself`() {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.NoTown) }
        composeRule.setContent {
            MyGameTheme {
                KoinIsolatedContext(context = app.graph) {
                    AppNavigation(
                        dependencies = app,
                        reminderTaps = emptyFlow(),
                        mailedLinks = emptyFlow(),
                        backStack = rememberNavBackStack(Destination.Naming),
                    )
                }
            }
        }

        waitForLine(NAMING_TITLE)

        assertEquals(NAMING_SCREEN_READS, towns.readCount)
    }

    private companion object {
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
        const val NAMING_SCREEN_READS: Int = 1
    }
}
