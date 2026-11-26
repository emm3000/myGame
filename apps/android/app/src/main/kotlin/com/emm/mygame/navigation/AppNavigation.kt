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
import com.emm.mygame.InPlayerLanguage
import com.emm.mygame.NavigationLinks
import com.emm.mygame.PlayerLanguageIntent
import com.emm.mygame.PlayerLanguageUiState
import com.emm.mygame.PlayerLanguageViewModel
import com.emm.mygame.SignedInChrome
import com.emm.mygame.TownFollowIntent
import com.emm.mygame.TownFollowViewModel
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.projection.StudyReminderLine
import com.emm.mygame.feature.account.verification.VerificationBannerRoute
import kotlinx.coroutines.flow.Flow

@Composable
internal fun AppNavigation(
    dependencies: AppDependencies,
    reminderTaps: Flow<StudyReminderLine>,
    mailedLinks: Flow<Destination.MailedLink>,
    modifier: Modifier = Modifier,
    backStack: NavBackStack<NavKey> = rememberNavBackStack(Destination.SignIn(isSessionEnded = false)),
    follow: TownFollowViewModel = viewModel { TownFollowViewModel(dependencies.towns, dependencies.clock) },
    bannerLanguage: PlayerLanguageViewModel = viewModel { PlayerLanguageViewModel(dependencies.playerLanguage) },
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
    LifecycleStartEffect(follow, shown) {
        follow.onIntent(TownFollowIntent.ScreenShown(isLessonFinishFollowed = shown.isLessonFinishFollowed()))
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
            chrome = { navigator: Navigator ->
                SignedInChrome(
                    dependencies = dependencies,
                    navigator = navigator,
                    onTaskAnswered = { follow.onIntent(TownFollowIntent.TaskAnswered) },
                )
            },
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
            signedOutEntries(dependencies, navigator)
            signedInEntries(chrome(navigator))
        },
        modifier = modifier,
    )
}

private fun EntryProviderScope<NavKey>.signedInEntries(chrome: SignedInChrome) {
    todayEntry(chrome)
    namingEntry(chrome)
    townEntry(chrome)
    schoolEntry(chrome)
    reportEntry(chrome)
    newsEntry(chrome)
    settingsEntry(chrome)
    jobsEntry(chrome)
    placementEntry(chrome)
    holdoutCheckEntry(chrome)
    lessonWordsEntry(chrome)
    schoolTextEntry(chrome)
    reviewEntry(chrome)
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
    Destination.School,
    Destination.Map,
    is Destination.LessonWords,
    is Destination.SchoolText,
    Destination.Review,
    Destination.Report,
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
    Destination.Report,
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
    Destination.School,
    Destination.Map,
    is Destination.LessonWords,
    -> false
}
