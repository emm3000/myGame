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
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.feature.fief.ReviewRoute
import com.emm.mygame.feature.report.ReportNavigation
import com.emm.mygame.feature.report.ReportRoute
import com.emm.mygame.feature.school.LessonWalk
import com.emm.mygame.feature.school.LessonWordsNavigation
import com.emm.mygame.feature.school.LessonWordsRoute
import com.emm.mygame.feature.school.SchoolRoute
import com.emm.mygame.feature.signin.ForgotPasswordRoute
import com.emm.mygame.feature.signin.SignInRoute
import com.emm.mygame.feature.signin.SignUpRoute
import com.emm.mygame.feature.town.TownNavigation
import com.emm.mygame.feature.town.TownRoute
import com.emm.mygame.feature.town.TownStatus
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusScreen
import com.emm.mygame.feature.town.TownStatusUiState
import com.emm.mygame.feature.town.TownStatusViewModel

@Composable
internal fun AppNavigation(
    dependencies: AppDependencies,
    modifier: Modifier = Modifier,
    backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false)),
    status: TownStatusViewModel = viewModel { TownStatusViewModel(dependencies.towns, dependencies.clock) },
) {
    val navigator: Navigator = remember(backStack) { Navigator(backStack) }
    LaunchedEffect(navigator) {
        navigator.followSessionEnds(dependencies.sessionEnds.ended)
    }
    val shown: NavKey? = backStack.lastOrNull()
    LifecycleStartEffect(status, shown) {
        status.onIntent(TownStatusIntent.ScreenShown(shown.statusScreen()))
        onStopOrDispose { status.onIntent(TownStatusIntent.ScreenHidden) }
    }
    val statusState: TownStatusUiState by status.state.collectAsStateWithLifecycle()
    val townStatus: @Composable () -> Unit = {
        TownStatus(
            state = statusState,
            onNoticeClose = { status.onIntent(TownStatusIntent.NoticeClosed) },
            onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
            onReviewsOpen = navigator::openReviews,
        )
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
            signedInEntries(SignedInChrome(dependencies, navigator, townStatus))
        },
        modifier = modifier,
    )
}

private fun EntryProviderScope<NavKey>.signedInEntries(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    townEntry(chrome)
    schoolEntry(chrome)
    reportEntry(chrome)
    lessonWordsEntry(chrome)
    entry<Destination.Review> {
        SignedInFrame(
            isTownHome = false,
            doesScreenReadTown = true,
            chrome = chrome,
        ) {
            ReviewRoute(
                learning = dependencies.learning,
                towns = dependencies.towns,
                clock = dependencies.clock,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onTownOpen = navigator::openTown,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.townEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Town> {
        SignedInFrame(
            isTownHome = true,
            doesScreenReadTown = true,
            chrome = chrome,
        ) {
            TownRoute(
                towns = dependencies.towns,
                sessions = dependencies.sessions,
                clock = dependencies.clock,
                navigation = TownNavigation(
                    onSchoolOpen = navigator::openSchool,
                    onReportOpen = navigator::openReport,
                    onReviewsOpen = navigator::openReviews,
                    onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                ),
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
                status = chrome.status,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.schoolEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.School> {
        SignedInFrame(
            isTownHome = false,
            doesScreenReadTown = true,
            chrome = chrome,
        ) {
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                onReviewsOpen = navigator::openReviews,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onReportOpen = navigator::openReport,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.reportEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Report> {
        SignedInFrame(
            isTownHome = false,
            doesScreenReadTown = false,
            chrome = chrome,
        ) {
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
}

private fun EntryProviderScope<NavKey>.lessonWordsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(
            isTownHome = false,
            doesScreenReadTown = true,
            chrome = chrome,
        ) {
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
    isTownHome: Boolean,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val framedInsets: WindowInsets =
        if (isTownHome) WindowInsets.ime else WindowInsets.ime.union(WindowInsets.statusBars)
    Column(modifier = modifier.fillMaxSize().background(MyGameTheme.colors.surface)) {
        if (!isTownHome) {
            MyGameHeader(
                modifier = Modifier.statusBarsPadding().padding(horizontal = MyGameSpacing.step4),
                end = { RetainedWordsRing(towns = chrome.dependencies.towns, doesScreenReadTown = doesScreenReadTown) },
            ) {
                MyGameBackLink(
                    label = stringResource(R.string.navigation_town),
                    isEnabled = chrome.navigator.areLinksEnabled,
                    onClick = chrome.navigator::openTown,
                )
            }
            chrome.status()
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

private class SignedInChrome(
    val dependencies: AppDependencies,
    val navigator: Navigator,
    val status: @Composable () -> Unit,
)

private fun NavKey?.statusScreen(): TownStatusScreen = when (val destination: Destination? = this as? Destination) {
    null, is Destination.SignIn, Destination.SignUp, Destination.ForgotPassword -> TownStatusScreen.Outside
    Destination.Town -> TownStatusScreen.ReadsTown
    Destination.School -> TownStatusScreen.ReadsTown
    is Destination.LessonWords -> TownStatusScreen.LessonWords(destination.lesson)
    Destination.Review -> TownStatusScreen.Reviews
    Destination.Report -> TownStatusScreen.ReadsNoTown
}
