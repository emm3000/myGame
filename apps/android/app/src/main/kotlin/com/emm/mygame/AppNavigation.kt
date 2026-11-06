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
import com.emm.mygame.core.designsystem.MyGameBackLink
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.feature.chronicle.ChronicleRoute
import com.emm.mygame.feature.fief.ReviewRoute
import com.emm.mygame.feature.map.MapRoute
import com.emm.mygame.feature.report.ReportNavigation
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
internal fun AppNavigation(
    dependencies: AppDependencies,
    modifier: Modifier = Modifier,
    backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false)),
) {
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
    entry<Destination.Town> {
        SignedInFrame(isTownHome = true, navigator = navigator) {
            TownRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onSchoolOpen = navigator::openSchool,
                onReportOpen = navigator::openReport,
            )
        }
    }
    entry<Destination.School> {
        SignedInFrame(isTownHome = false, navigator = navigator) {
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                onReviewsOpen = navigator::openReviews,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
            )
        }
    }
    entry<Destination.Report> {
        SignedInFrame(isTownHome = false, navigator = navigator) {
            ReportRoute(
                reports = dependencies.reports,
                sessions = dependencies.sessions,
                clock = dependencies.clock,
                navigation = ReportNavigation(
                    onReviewsOpen = navigator::openReviews,
                    onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                ),
            )
        }
    }
    lessonWordsEntry(dependencies = dependencies, navigator = navigator)
    entry<Destination.Review> {
        SignedInFrame(isTownHome = false, navigator = navigator) {
            ReviewRoute(learning = dependencies.learning, clock = dependencies.clock)
        }
    }
    entry<Destination.Map> { shown: Destination.Map ->
        FiefFrame(fief = shown.fief, dependencies = dependencies, navigator = navigator) {
            MapRoute(fief = shown.fief, maps = dependencies.maps, fiefs = dependencies.fiefs)
        }
    }
    entry<Destination.Chronicle> { shown: Destination.Chronicle ->
        FiefFrame(fief = shown.fief, dependencies = dependencies, navigator = navigator) {
            ChronicleRoute(fief = shown.fief, chronicles = dependencies.chronicles, clock = dependencies.clock)
        }
    }
}

private fun EntryProviderScope<NavKey>.lessonWordsEntry(dependencies: AppDependencies, navigator: Navigator) {
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(isTownHome = false, navigator = navigator) {
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
private fun FiefFrame(
    fief: FiefId,
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
    SignedInFrame(
        isTownHome = false,
        navigator = navigator,
        modifier = modifier,
        underHeader = {
            (listing as? FiefSwitcherUiState.Listed)?.let { listed: FiefSwitcherUiState.Listed ->
                FiefSwitcher(listed = listed, isEnabled = navigator.areLinksEnabled, onChoose = navigator::switchFief)
            }
        },
        content = content,
    )
}

@Composable
private fun SignedInFrame(
    isTownHome: Boolean,
    navigator: Navigator,
    modifier: Modifier = Modifier,
    underHeader: @Composable () -> Unit = {},
    content: @Composable () -> Unit,
) {
    val framedInsets: WindowInsets =
        if (isTownHome) WindowInsets.ime else WindowInsets.ime.union(WindowInsets.statusBars)
    Column(modifier = modifier.fillMaxSize().background(MyGameTheme.colors.surface)) {
        if (!isTownHome) {
            MyGameHeader(modifier = Modifier.statusBarsPadding().padding(horizontal = MyGameSpacing.step4)) {
                MyGameBackLink(
                    label = stringResource(R.string.navigation_town),
                    isEnabled = navigator.areLinksEnabled,
                    onClick = navigator::openTown,
                )
            }
            underHeader()
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
