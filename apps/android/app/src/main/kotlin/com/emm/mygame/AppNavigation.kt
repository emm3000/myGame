package com.emm.mygame

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.retain.retain
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.projection.StudyReminderLine
import com.emm.mygame.feature.map.MapRoute
import com.emm.mygame.feature.placement.HoldoutCheckRoute
import com.emm.mygame.feature.placement.PlacementOfferRoute
import com.emm.mygame.feature.placement.PlacementRoute
import com.emm.mygame.feature.report.NewsRoute
import com.emm.mygame.feature.report.ReportNavigation
import com.emm.mygame.feature.report.ReportRoute
import com.emm.mygame.feature.review.ReviewRoute
import com.emm.mygame.feature.school.HoldoutCheckRow
import com.emm.mygame.feature.school.HoldoutCheckRowsRoute
import com.emm.mygame.feature.school.LessonWalk
import com.emm.mygame.feature.school.LessonWordsNavigation
import com.emm.mygame.feature.school.LessonWordsRoute
import com.emm.mygame.feature.school.SchoolRoute
import com.emm.mygame.feature.school.SchoolTextRoute
import com.emm.mygame.feature.school.SchoolUiState
import com.emm.mygame.feature.school.SchoolViewModel
import com.emm.mygame.feature.school.schoolStudyGo
import com.emm.mygame.feature.signin.ForgotPasswordRoute
import com.emm.mygame.feature.signin.ResetPasswordRoute
import com.emm.mygame.feature.signin.SettingsNavigation
import com.emm.mygame.feature.signin.SettingsRoute
import com.emm.mygame.feature.signin.SignInRoute
import com.emm.mygame.feature.signin.SignUpRoute
import com.emm.mygame.feature.signin.VerificationBannerRoute
import com.emm.mygame.feature.signin.VerifyEmailRoute
import com.emm.mygame.feature.town.TownNavigation
import com.emm.mygame.feature.town.TownRoute
import com.emm.mygame.feature.town.TownStatus
import com.emm.mygame.feature.town.TownStatusIntent
import com.emm.mygame.feature.town.TownStatusScreen
import com.emm.mygame.feature.town.TownStatusUiState
import com.emm.mygame.feature.town.TownStatusViewModel
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.TownViewModel
import kotlinx.coroutines.flow.Flow

@Composable
internal fun AppNavigation(
    dependencies: AppDependencies,
    reminderTaps: Flow<StudyReminderLine>,
    mailedLinks: Flow<Destination.MailedLink>,
    modifier: Modifier = Modifier,
    backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false)),
    status: TownStatusViewModel = viewModel { TownStatusViewModel(dependencies.towns, dependencies.clock) },
) {
    val links: NavigationLinks = retain { NavigationLinks() }
    val navigator: Navigator = remember(backStack, links) { Navigator(backStack, links) }
    LaunchedEffect(navigator) {
        navigator.followSessionEnds(dependencies.sessionEnds.ended)
    }
    LaunchedEffect(navigator) {
        reminderTaps.collect(navigator::openReminder)
    }
    LaunchedEffect(navigator) {
        mailedLinks.collect(navigator::openMailedLink)
    }
    val shown: NavKey? = backStack.lastOrNull()
    LifecycleStartEffect(status, shown) {
        status.onIntent(TownStatusIntent.ScreenShown(shown.statusScreen()))
        onStopOrDispose { status.onIntent(TownStatusIntent.ScreenHidden) }
    }
    val statusState: State<TownStatusUiState> = status.state.collectAsStateWithLifecycle()
    val townStatus: @Composable (TownStatusUiState.Dock?) -> Unit = { dock: TownStatusUiState.Dock? ->
        TownStatus(
            state = statusState.value,
            dock = dock,
            onNoticeClose = { status.onIntent(TownStatusIntent.NoticeClosed) },
            onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
            onReviewsOpen = navigator::openReviews,
        )
    }
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .windowInsetsPadding(WindowInsets.navigationBars.only(WindowInsetsSides.Bottom)),
    ) {
        AppScreens(
            dependencies = dependencies,
            navigator = navigator,
            backStack = backStack,
            chrome = { navigator: Navigator ->
                SignedInChrome(dependencies, navigator, statusState, status::onIntent, townStatus)
            },
            modifier = Modifier.weight(1f),
        )
        val isSessionOpen: Boolean = shown.statusScreen() != TownStatusScreen.Outside
        val language: PlayerLanguage? by dependencies.playerLanguage.collectAsStateWithLifecycle()
        InPlayerLanguage(language = language.takeIf { isSessionOpen }) {
            VerificationBannerRoute(sessions = dependencies.sessions, isSessionOpen = isSessionOpen)
        }
    }
}

@Composable
private fun AppScreens(
    dependencies: AppDependencies,
    navigator: Navigator,
    backStack: NavBackStack<NavKey>,
    chrome: (Navigator) -> SignedInChrome,
    modifier: Modifier = Modifier,
) {
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
            entry<Destination.ResetPassword> { link: Destination.ResetPassword ->
                BackHandler(onBack = navigator::openSignIn)
                ResetPasswordRoute(
                    sessions = dependencies.sessions,
                    token = link.token,
                    onSignInOpen = navigator::openSignIn,
                    onForgotPasswordOpen = navigator::openForgotPassword,
                )
            }
            entry<Destination.VerifyEmail> { link: Destination.VerifyEmail ->
                BackHandler(onBack = navigator::openSignIn)
                VerifyEmailRoute(
                    sessions = dependencies.sessions,
                    token = link.token,
                    onTownOpen = navigator::openTown,
                    onSignInOpen = navigator::openSignIn,
                )
            }
            signedInEntries(chrome(navigator))
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
    newsEntry(chrome)
    settingsEntry(chrome)
    mapEntry(chrome)
    placementEntry(chrome)
    holdoutCheckEntry(chrome)
    lessonWordsEntry(chrome)
    schoolTextEntry(chrome)
    entry<Destination.Review> {
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            ReviewRoute(
                learning = dependencies.learning,
                towns = dependencies.towns,
                clock = dependencies.clock,
                task = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.townEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Town> {
        val town: TownViewModel = viewModel {
            TownViewModel(dependencies.towns, dependencies.sessions, dependencies.clock)
        }
        val townState: State<TownUiState> = town.state.collectAsStateWithLifecycle()
        SignedInFrame(
            kind = FrameKind.Home,
            doesScreenReadTown = true,
            chrome = chrome,
            isDockWithheld = townState.value.isDockWithheld,
        ) { frame: ScreenFrame ->
            TownRoute(
                towns = dependencies.towns,
                sessions = dependencies.sessions,
                clock = dependencies.clock,
                viewModel = town,
                navigation = TownNavigation(
                    onSchoolOpen = navigator::openSchool,
                    onMapOpen = navigator::openMap,
                    onTextOpen = { text: TextId ->
                        navigator.openAbove(Destination.Town, Destination.SchoolText(text))
                    },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                ),
                ring = { RetainedWordsRing(towns = dependencies.towns, doesScreenReadTown = true) },
                status = frame.status,
                foldedDock = frame.foldedDock,
                reportRow = frame.reportRow,
                placement = {
                    PlacementOfferRoute(
                        placements = dependencies.placements,
                        onPlacementOpen = navigator::openPlacement,
                    )
                },
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.schoolEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.School> {
        val school: SchoolViewModel = viewModel { SchoolViewModel(dependencies.towns, dependencies.clock) }
        val schoolState: State<SchoolUiState> = school.state.collectAsStateWithLifecycle()
        val heldTown: State<HeldTown?> = dependencies.towns.town.collectAsStateWithLifecycle()
        val drawnLesson: LessonId? = schoolState.value.drawnLesson()
        LaunchedEffect(drawnLesson) { chrome.onStatusIntent(TownStatusIntent.SchoolLessonDrawn(drawnLesson)) }
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
            studyInPlace = { number: Int ->
                schoolStudyGo(schoolState.value, heldTown.value?.town, number, school::onIntent)
            },
        ) { frame: ScreenFrame ->
            SchoolRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                onLessonOpen = { lesson: LessonId -> navigator.openLesson(lesson, walked = emptyList()) },
                onLessonStart = frame.onAnswered,
                onTextOpen = { text: TextId -> navigator.openAbove(Destination.School, Destination.SchoolText(text)) },
                viewModel = school,
                foldedDock = frame.foldedDock,
                holdoutChecks = {
                    HoldoutCheckRowsRoute(
                        holdoutChecks = dependencies.holdoutChecks,
                        onHoldoutCheckOpen = { row: HoldoutCheckRow -> navigator.openHoldoutCheck(row.band, row.week) },
                    )
                },
            )
        }
    }
}

private fun SchoolUiState.drawnLesson(): LessonId? =
    ((this as? SchoolUiState.Content)?.slot as? SchoolUiState.SlotLine.Running)?.lesson

private fun EntryProviderScope<NavKey>.reportEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Report> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            ReportRoute(
                reports = dependencies.reports,
                sessions = dependencies.sessions,
                reminders = dependencies.studyReminders,
                clock = dependencies.clock,
                navigation = ReportNavigation(
                    onNewsOpen = { navigator.openAbove(Destination.Report, Destination.News) },
                    onSettingsOpen = { navigator.openAbove(Destination.Report, Destination.Settings) },
                    onSigningOut = navigator::signingOut,
                    onSignedOut = { navigator.signedOut(isSessionEnded = false) },
                    onNewsClosed = frame.onAnswered,
                ),
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.newsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.News> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            NewsRoute(reports = dependencies.reports, clock = dependencies.clock, foldedDock = frame.foldedDock)
        }
    }
}

private fun EntryProviderScope<NavKey>.settingsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Settings> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            val context: Context = LocalContext.current
            SettingsRoute(
                sessions = dependencies.sessions,
                playerScaffold = dependencies.playerScaffold,
                reminders = dependencies.studyReminders,
                notifications = dependencies.reminderNotifications,
                themes = dependencies.themes,
                rememberNotificationAsk = { onAnswer: (Boolean) -> Unit -> rememberNotificationAsk(onAnswer) },
                navigation = SettingsNavigation(
                    onNotificationSettingsOpen = { context.openNotificationSettings() },
                ),
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.mapEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.Map> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            MapRoute(
                towns = dependencies.towns,
                clock = dependencies.clock,
                onNoTown = navigator::openTown,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.placementEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Placement> {
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            PlacementRoute(
                placements = dependencies.placements,
                hook = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.holdoutCheckEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.HoldoutCheck> { check: Destination.HoldoutCheck ->
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = false,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            HoldoutCheckRoute(
                holdoutChecks = dependencies.holdoutChecks,
                band = check.band,
                week = check.week,
                hook = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.lessonWordsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.LessonWords> { shown: Destination.LessonWords ->
        SignedInFrame(
            kind = FrameKind.Task,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
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
                task = frame.task,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

private fun EntryProviderScope<NavKey>.schoolTextEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    val navigator: Navigator = chrome.navigator
    entry<Destination.SchoolText> { shown: Destination.SchoolText ->
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = true,
            chrome = chrome,
        ) { frame: ScreenFrame ->
            SchoolTextRoute(
                text = shown.text,
                texts = dependencies.texts,
                onNoTown = navigator::openTown,
                onSchoolOpen = navigator::openSchool,
                foldedDock = frame.foldedDock,
            )
        }
    }
}

@Composable
private fun SignedInFrame(
    kind: FrameKind,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
    modifier: Modifier = Modifier,
    isDockWithheld: Boolean = false,
    studyInPlace: @Composable (Int) -> MyGameDockGo? = { null },
    content: @Composable (ScreenFrame) -> Unit,
) {
    val language: PlayerLanguage? by chrome.dependencies.playerLanguage.collectAsStateWithLifecycle()
    InPlayerLanguage(language = rememberLastKnown(language)) {
        FramedScreen(
            kind = kind,
            doesScreenReadTown = doesScreenReadTown,
            chrome = chrome,
            modifier = modifier,
            isDockWithheld = isDockWithheld,
            studyInPlace = studyInPlace,
            content = content,
        )
    }
}

private fun NavKey?.statusScreen(): TownStatusScreen = when (val destination: Destination? = this as? Destination) {
    null,
    is Destination.SignIn,
    Destination.SignUp,
    Destination.ForgotPassword,
    is Destination.MailedLink,
    -> TownStatusScreen.Outside
    Destination.Town -> TownStatusScreen.ReadsTown
    Destination.School -> TownStatusScreen.School
    Destination.Map -> TownStatusScreen.ReadsTown
    is Destination.LessonWords -> TownStatusScreen.LessonWords(destination.lesson)
    is Destination.SchoolText -> TownStatusScreen.ReadsNoTown
    Destination.Review -> TownStatusScreen.Reviews
    Destination.Report -> TownStatusScreen.Report
    Destination.News -> TownStatusScreen.ReadsNoTown
    Destination.Settings -> TownStatusScreen.ReadsNoTown
    Destination.Placement -> TownStatusScreen.ReadsNoTown
    is Destination.HoldoutCheck -> TownStatusScreen.ReadsNoTown
}
