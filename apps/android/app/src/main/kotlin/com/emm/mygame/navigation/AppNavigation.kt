package com.emm.mygame.navigation

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
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.account.InPlayerLanguage
import com.emm.mygame.account.PlayerLanguageIntent
import com.emm.mygame.account.PlayerLanguageUiState
import com.emm.mygame.account.PlayerLanguageViewModel
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.feature.account.verification.VerificationBannerRoute
import com.emm.mygame.feature.shell.bar.AppNavigationBar
import com.emm.mygame.feature.shell.bar.Tab
import kotlinx.coroutines.flow.Flow

@Composable
internal fun AppNavigation(
    dependencies: AppDependencies,
    reminderTaps: Flow<Unit>,
    mailedLinks: Flow<Destination.MailedLink>,
    modifier: Modifier = Modifier,
    backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false)),
    follow: TownFollowViewModel = viewModel { TownFollowViewModel(dependencies.towns, dependencies.clock) },
    bannerLanguage: PlayerLanguageViewModel = viewModel { PlayerLanguageViewModel(dependencies.playerLanguage) },
) {
    val links: NavigationLinks = retain { NavigationLinks() }
    val navigator: Navigator = remember(backStack, links) { Navigator(backStack, links) }
    NavigatorEventsEffect(
        navigator = navigator,
        sessionEnds = dependencies.sessionEnds.ended,
        reminderTaps = reminderTaps,
        mailedLinks = mailedLinks,
    )
    val shown: NavKey? = backStack.lastOrNull()
    LifecycleStartEffect(follow, shown) {
        follow.onIntent(
            TownFollowIntent.ScreenShown(
                isLessonFinishFollowed = shown.isLessonFinishFollowed(),
                isTownReadOnOpen = shown.isTownReadOnOpen(),
            ),
        )
        onStopOrDispose { follow.onIntent(TownFollowIntent.ScreenHidden) }
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
            onTaskAnswer = { follow.onIntent(TownFollowIntent.TaskAnswered) },
            modifier = Modifier.weight(1f),
        )
        val isSessionOpen: Boolean = shown.isSignedIn()
        LaunchedEffect(bannerLanguage, isSessionOpen) {
            if (isSessionOpen) return@LaunchedEffect
            bannerLanguage.onIntent(PlayerLanguageIntent.SessionClosed)
        }
        val banner: PlayerLanguageUiState by bannerLanguage.state.collectAsStateWithLifecycle()
        val held: State<HeldTown?> = dependencies.towns.town.collectAsStateWithLifecycle()
        InPlayerLanguage(language = banner.language.takeIf { isSessionOpen }) {
            navigator.openTab?.let { open: Tab ->
                AppNavigationBar(open = open, town = held.value?.town, onTabOpen = navigator::openTab)
            }
            VerificationBannerRoute(sessions = dependencies.sessions, isSessionOpen = isSessionOpen)
        }
    }
}

@Composable
private fun NavigatorEventsEffect(
    navigator: Navigator,
    sessionEnds: Flow<Unit>,
    reminderTaps: Flow<Unit>,
    mailedLinks: Flow<Destination.MailedLink>,
) {
    LaunchedEffect(navigator) {
        navigator.followSessionEnds(sessionEnds)
    }
    LaunchedEffect(navigator) {
        reminderTaps.collect { navigator.openReminder() }
    }
    LaunchedEffect(navigator) {
        mailedLinks.collect(navigator::openMailedLink)
    }
}

@Composable
private fun AppScreens(
    dependencies: AppDependencies,
    navigator: Navigator,
    backStack: NavBackStack<NavKey>,
    onTaskAnswer: () -> Unit,
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
            signedOutEntries(dependencies, navigator)
            signedInEntries(dependencies, navigator, onTaskAnswer)
        },
        modifier = modifier,
    )
}

private fun EntryProviderScope<NavKey>.signedInEntries(
    dependencies: AppDependencies,
    navigator: Navigator,
    onTaskAnswer: () -> Unit,
) {
    todayEntry(dependencies, navigator)
    namingEntry(dependencies, navigator)
    townEntry(dependencies, navigator)
    placeEntry(dependencies, navigator)
    schoolEntry(dependencies, navigator, onTaskAnswer)
    newsEntry(dependencies, navigator)
    settingsEntry(dependencies, navigator)
    jobsEntry(dependencies, navigator)
    placementEntry(dependencies, navigator, onTaskAnswer)
    holdoutCheckEntry(dependencies, navigator, onTaskAnswer)
    lessonWordsEntry(dependencies, navigator)
    schoolTextEntry(dependencies, navigator)
    reviewEntry(dependencies, navigator, onTaskAnswer)
}

private fun NavKey?.isSignedIn(): Boolean = when (this as? Destination) {
    null,
    is Destination.SignIn,
    Destination.SignUp,
    Destination.ForgotPassword,
    is Destination.MailedLink,
    -> false
    Destination.Naming,
    Destination.Today,
    Destination.Town,
    is Destination.Place,
    Destination.School,
    Destination.Map,
    is Destination.LessonWords,
    is Destination.SchoolText,
    Destination.Review,
    Destination.News,
    Destination.Settings,
    Destination.Placement,
    is Destination.HoldoutCheck,
    -> true
}

private fun NavKey?.isLessonFinishFollowed(): Boolean = when (this as? Destination) {
    Destination.Naming,
    is Destination.SchoolText,
    Destination.Review,
    Destination.News,
    Destination.Settings,
    Destination.Placement,
    is Destination.HoldoutCheck,
    -> true
    null,
    is Destination.SignIn,
    Destination.SignUp,
    Destination.ForgotPassword,
    is Destination.MailedLink,
    Destination.Today,
    Destination.Town,
    is Destination.Place,
    Destination.School,
    Destination.Map,
    is Destination.LessonWords,
    -> false
}

private fun NavKey?.isTownReadOnOpen(): Boolean = when (this as? Destination) {
    is Destination.SchoolText,
    Destination.News,
    Destination.Placement,
    is Destination.HoldoutCheck,
    -> true
    null,
    is Destination.SignIn,
    Destination.SignUp,
    Destination.ForgotPassword,
    is Destination.MailedLink,
    Destination.Naming,
    Destination.Today,
    Destination.Town,
    is Destination.Place,
    Destination.School,
    Destination.Map,
    is Destination.LessonWords,
    Destination.Review,
    Destination.Settings,
    -> false
}
