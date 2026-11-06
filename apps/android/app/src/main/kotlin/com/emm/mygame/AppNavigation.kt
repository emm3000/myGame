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
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.EntryProviderScope
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
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.feature.chronicle.ChronicleRoute
import com.emm.mygame.feature.fief.ReviewRoute
import com.emm.mygame.feature.map.MapRoute
import com.emm.mygame.feature.report.ReportRoute
import com.emm.mygame.feature.school.LessonWalk
import com.emm.mygame.feature.school.LessonWordsNavigation
import com.emm.mygame.feature.school.LessonWordsRoute
import com.emm.mygame.feature.school.SchoolRoute
import com.emm.mygame.feature.signin.ForgotPasswordRoute
import com.emm.mygame.feature.signin.SignInRoute
import com.emm.mygame.feature.signin.SignUpRoute
import com.emm.mygame.feature.town.TownRoute

@Composable
internal fun AppNavigation(dependencies: AppDependencies, modifier: Modifier = Modifier) {
    val backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false))
    val navigator: Navigator = remember(backStack) { Navigator(backStack) }
    LaunchedEffect(navigator) {
        navigator.followSessionEnds(dependencies.sessionEnds.ended)
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
                    sessions = dependencies.sessions,
                    isSessionEnded = signIn.isSessionEnded,
                    onSignedIn = navigator::signedIn,
                    onSignUpOpen = navigator::openSignUp,
                    onForgotPasswordOpen = navigator::openForgotPassword,
                )
            }
            entry<Destination.SignUp> {
                SignUpRoute(
                    sessions = dependencies.sessions,
                    onSignedIn = navigator::signedIn,
                    onSignInOpen = navigator::openSignIn,
                )
            }
            entry<Destination.ForgotPassword> {
                ForgotPasswordRoute(sessions = dependencies.sessions, onSignInOpen = navigator::openSignIn)
            }
            signedInEntries(dependencies = dependencies, navigator = navigator)
        },
        modifier = modifier,
    )
}

private fun EntryProviderScope<NavKey>.signedInEntries(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.Town> { shown: Destination.Town ->
        SignedInFrame(current = shown, fief = null, dependencies = dependencies, navigator = navigator) {
            TownRoute(
                towns = dependencies.towns,
                sessions = dependencies.sessions,
                clock = dependencies.clock,
                onSchoolOpen = navigator::openSchool,
                onSigningOut = navigator::signingOut,
                onSignedOut = { navigator.signedOut(isSessionEnded = false) },
            )
        }
    }
    entry<Destination.School> { shown: Destination.School ->
        SignedInFrame(current = shown, fief = null, dependencies = dependencies, navigator = navigator) {
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                onReviewsOpen = navigator::openReviews,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
            )
        }
    }
    entry<Destination.Report> { shown: Destination.Report ->
        SignedInFrame(current = shown, fief = null, dependencies = dependencies, navigator = navigator) {
            ReportRoute(
                reports = dependencies.reports,
                clock = dependencies.clock,
                onReviewsOpen = navigator::openReviews,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
            )
        }
    }
    lessonWordsEntry(dependencies = dependencies, navigator = navigator)
    entry<Destination.Review> { shown: Destination.Review ->
        SignedInFrame(current = shown, fief = null, dependencies = dependencies, navigator = navigator) {
            ReviewRoute(learning = dependencies.learning, clock = dependencies.clock)
        }
    }
    entry<Destination.Map> { shown: Destination.Map ->
        SignedInFrame(current = shown, fief = shown.fief, dependencies = dependencies, navigator = navigator) {
            MapRoute(fief = shown.fief, maps = dependencies.maps, fiefs = dependencies.fiefs)
        }
    }
    entry<Destination.Chronicle> { shown: Destination.Chronicle ->
        SignedInFrame(current = shown, fief = shown.fief, dependencies = dependencies, navigator = navigator) {
            ChronicleRoute(fief = shown.fief, chronicles = dependencies.chronicles, clock = dependencies.clock)
        }
    }
}

private fun EntryProviderScope<NavKey>.lessonWordsEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(current = shown, fief = null, dependencies = dependencies, navigator = navigator) {
            LessonWordsRoute(
                walk = LessonWalk(shown.lesson, shown.walked),
                towns = dependencies.towns,
                reports = dependencies.reports,
                clock = dependencies.clock,
                navigation = LessonWordsNavigation(
                    onNoTown = navigator::openTown,
                    onLessonOpen = navigator::openLesson,
                    onReviewsOpen = navigator::openReviews,
                    onSchoolOpen = navigator::openSchool,
                ),
            )
        }
    }
}

@Composable
private fun SignedInFrame(
    current: Destination,
    fief: FiefId?,
    dependencies: AppDependencies,
    navigator: Navigator,
    modifier: Modifier = Modifier,
    switcher: FiefSwitcherViewModel = viewModel { FiefSwitcherViewModel(fief, dependencies.listings) },
    content: @Composable () -> Unit,
) {
    val listing: FiefSwitcherUiState by switcher.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(switcher) {
        switcher.onIntent(FiefSwitcherIntent.ScreenShown)
        onStopOrDispose { switcher.onIntent(FiefSwitcherIntent.ScreenHidden) }
    }
    val listed: FiefSwitcherUiState.Listed? = listing as? FiefSwitcherUiState.Listed
    val tabFief: FiefId? = fief ?: listed?.entries?.firstOrNull()?.fief
    val shownSwitcher: FiefSwitcherUiState.Listed? = listed?.takeIf { fief != null }
    val belowContent: WindowInsets = WindowInsets.navigationBars.union(WindowInsets.ime)
    val framedInsets: WindowInsets =
        if (shownSwitcher == null) belowContent else belowContent.union(WindowInsets.statusBars)
    Column(modifier = modifier.fillMaxSize().background(MyGameTheme.colors.surface)) {
        if (shownSwitcher != null) {
            FiefSwitcher(
                listed = shownSwitcher,
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
            content()
        }
        SignedInTabs(current = current, fief = tabFief, navigator = navigator)
    }
}

@Composable
private fun SignedInTabs(
    current: Destination,
    fief: FiefId?,
    navigator: Navigator,
    modifier: Modifier = Modifier,
) {
    MyGameNavigationBar(modifier = modifier.navigationBarsPadding()) {
        MyGameNavigationItem(
            label = stringResource(R.string.navigation_town),
            isCurrent = current == Destination.Town ||
                current == Destination.School ||
                current is Destination.LessonWords,
            isEnabled = navigator.areTabsEnabled,
            onClick = navigator::openTown,
        )
        MyGameNavigationItem(
            label = stringResource(R.string.navigation_report),
            isCurrent = current == Destination.Report || current == Destination.Review,
            isEnabled = navigator.areTabsEnabled,
            onClick = navigator::openReport,
        )
        if (fief != null) {
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_map),
                isCurrent = current is Destination.Map,
                isEnabled = navigator.areTabsEnabled,
                onClick = { navigator.openMap(fief) },
            )
            MyGameNavigationItem(
                label = stringResource(R.string.navigation_chronicle),
                isCurrent = current is Destination.Chronicle,
                isEnabled = navigator.areTabsEnabled,
                onClick = { navigator.openChronicle(fief) },
            )
        }
    }
}
