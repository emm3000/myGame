package com.emm.mygame

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fitInside
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.union
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.WindowInsetsRulers
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
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
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.feature.chronicle.ChronicleRoute
import com.emm.mygame.feature.fief.FiefNavigation
import com.emm.mygame.feature.fief.FiefRoute
import com.emm.mygame.feature.fief.FirstFiefRoute
import com.emm.mygame.feature.fief.ReviewRoute
import com.emm.mygame.feature.map.MapRoute
import com.emm.mygame.feature.signin.ForgotPasswordRoute
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
                    onForgotPasswordOpen = navigator::openForgotPassword,
                )
            }
            entry<Destination.SignUp> {
                SignUpRoute(
                    sessions = application.sessions,
                    onSignedIn = navigator::signedIn,
                    onSignInOpen = navigator::openSignIn,
                )
            }
            entry<Destination.ForgotPassword> {
                ForgotPasswordRoute(sessions = application.sessions, onSignInOpen = navigator::openSignIn)
            }
            entry<Destination.FirstFief> {
                FirstFiefRoute(
                    listings = application.listings,
                    sessions = application.sessions,
                    onOpen = navigator::firstFiefOpened,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                )
            }
            entry<Destination.Fief> { shown: Destination.Fief ->
                SignedInFief(shown = shown, application = application, navigator = navigator)
            }
            entry<Destination.Map> { shown: Destination.Map ->
                SignedInFrame(current = shown, fief = shown.fief, application = application, navigator = navigator) {
                    MapRoute(fief = shown.fief, maps = application.maps, fiefs = application.fiefs)
                }
            }
            entry<Destination.Review> { SignedInReview(application) }
            entry<Destination.Chronicle> { shown: Destination.Chronicle ->
                SignedInFrame(current = shown, fief = shown.fief, application = application, navigator = navigator) {
                    ChronicleRoute(fief = shown.fief, chronicles = application.chronicles, clock = application.clock)
                }
            }
        },
        modifier = modifier,
    )
}

@Composable
private fun SignedInFief(
    shown: Destination.Fief,
    application: MyGameApplication,
    navigator: Navigator,
    modifier: Modifier = Modifier,
) {
    SignedInFrame(
        current = shown,
        fief = shown.fief,
        application = application,
        navigator = navigator,
        modifier = modifier,
    ) { onNewFief: () -> Unit ->
        FiefRoute(
            fief = shown.fief,
            fiefs = application.fiefs,
            sessions = application.sessions,
            clock = application.clock,
            navigation = FiefNavigation(
                onSigningOut = navigator::signingOut,
                onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                onNewFief = onNewFief,
                onReviewOpen = navigator::openReview,
            ),
        )
    }
}

@Composable
private fun SignedInReview(application: MyGameApplication, modifier: Modifier = Modifier) {
    ReviewRoute(
        learning = application.learning,
        clock = application.clock,
        modifier = modifier,
    )
}

@Composable
private fun SignedInFrame(
    current: Destination,
    fief: FiefId,
    application: MyGameApplication,
    navigator: Navigator,
    modifier: Modifier = Modifier,
    switcher: FiefSwitcherViewModel = viewModel { FiefSwitcherViewModel(fief, application.listings) },
    content: @Composable (onNewFief: () -> Unit) -> Unit,
) {
    val listing: FiefSwitcherUiState by switcher.state.collectAsStateWithLifecycle()
    LaunchedEffect(switcher) {
        switcher.onIntent(FiefSwitcherIntent.ScreenShown)
    }
    val listed: FiefSwitcherUiState.Listed? = listing as? FiefSwitcherUiState.Listed
    val belowContent: WindowInsets = WindowInsets.navigationBars.union(WindowInsets.ime)
    val framedInsets: WindowInsets = if (listed == null) belowContent else belowContent.union(WindowInsets.statusBars)
    Column(modifier = modifier.fillMaxSize().background(MyGameTheme.colors.surface)) {
        if (listed != null) {
            FiefSwitcher(
                listed = listed,
                isEnabled = navigator.areTabsEnabled,
                onChoose = navigator::switchFief,
                modifier = Modifier.statusBarsPadding(),
            )
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .fitInside(WindowInsetsRulers.Ime.current)
                .consumeWindowInsets(framedInsets),
        ) {
            content { switcher.onIntent(FiefSwitcherIntent.FoundingApplied) }
        }
        MyGameNavigationBar(modifier = Modifier.navigationBarsPadding()) {
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_fief),
                isCurrent = current is Destination.Fief,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openFief,
            )
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_map),
                isCurrent = current is Destination.Map,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openMap,
            )
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_chronicle),
                isCurrent = current is Destination.Chronicle,
                isEnabled = navigator.areTabsEnabled,
                onClick = navigator::openChronicle,
            )
        }
    }
}
