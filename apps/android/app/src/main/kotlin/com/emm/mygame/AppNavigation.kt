package com.emm.mygame

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import com.emm.mygame.core.designsystem.MyGameNavigationBar
import com.emm.mygame.core.designsystem.MyGameNavigationItem
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.feature.chronicle.ChronicleRoute
import com.emm.mygame.feature.fief.FiefRoute
import com.emm.mygame.feature.map.MapRoute
import com.emm.mygame.feature.signin.SignInRoute
import com.emm.mygame.feature.signin.SignUpRoute

@Composable
internal fun AppNavigation(application: MyGameApplication, modifier: Modifier = Modifier) {
    val backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false))
    val navigator: Navigator = remember(backStack) { Navigator(backStack) }
    LaunchedEffect(navigator) {
        navigator.followSessionEnds(application.sessionEnds.ended)
    }
    NavDisplay(
        backStack = backStack,
        onBack = navigator::back,
        entryDecorators = listOf(
            rememberSaveableStateHolderNavEntryDecorator(),
            rememberViewModelStoreNavEntryDecorator(),
        ),
        entryProvider = entryProvider {
            entry<Destination.SignIn> { signIn: Destination.SignIn ->
                SignInRoute(
                    sessions = application.sessions,
                    isSessionEnded = signIn.isSessionEnded,
                    onSignedIn = navigator::signedIn,
                    onSignUpOpen = navigator::openSignUp,
                )
            }
            entry<Destination.SignUp> {
                SignUpRoute(
                    sessions = application.sessions,
                    onSignedIn = navigator::signedIn,
                    onSignInOpen = navigator::openSignIn,
                )
            }
            entry<Destination.Fief> {
                SignedInFrame(current = Destination.Fief, navigator = navigator) {
                    FiefRoute(
                        fiefs = application.fiefs,
                        sessions = application.sessions,
                        clock = application.clock,
                        onSigningOut = navigator::signingOut,
                        onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                    )
                }
            }
            entry<Destination.Map> {
                SignedInFrame(current = Destination.Map, navigator = navigator) {
                    MapRoute(maps = application.maps, fiefs = application.fiefs)
                }
            }
            entry<Destination.Chronicle> {
                SignedInFrame(current = Destination.Chronicle, navigator = navigator) {
                    ChronicleRoute(chronicles = application.chronicles, clock = application.clock)
                }
            }
        },
        modifier = modifier,
    )
}

@Composable
private fun SignedInFrame(
    current: Destination,
    navigator: Navigator,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Column(modifier = modifier.fillMaxSize().background(MyGameTheme.colors.surface)) {
        Box(modifier = Modifier.weight(1f).consumeWindowInsets(WindowInsets.navigationBars)) {
            content()
        }
        MyGameNavigationBar(modifier = Modifier.navigationBarsPadding()) {
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_fief),
                isCurrent = current == Destination.Fief,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openFief,
            )
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_map),
                isCurrent = current == Destination.Map,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openMap,
            )
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_chronicle),
                isCurrent = current == Destination.Chronicle,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openChronicle,
            )
        }
    }
}
