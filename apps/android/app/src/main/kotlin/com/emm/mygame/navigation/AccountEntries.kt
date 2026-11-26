package com.emm.mygame.navigation

import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.EntryProviderScope
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.AppDependencies
import com.emm.mygame.Destination
import com.emm.mygame.FrameKind
import com.emm.mygame.SignedInChrome
import com.emm.mygame.feature.account.password.ForgotPasswordRoute
import com.emm.mygame.feature.account.password.ResetPasswordRoute
import com.emm.mygame.feature.account.settings.SettingsNavigation
import com.emm.mygame.feature.account.settings.SettingsRoute
import com.emm.mygame.feature.account.signin.SignInRoute
import com.emm.mygame.feature.account.signup.SignUpRoute
import com.emm.mygame.feature.account.verification.VerifyEmailRoute
import com.emm.mygame.openNotificationSettings
import com.emm.mygame.rememberNotificationAsk

internal fun EntryProviderScope<NavKey>.signedOutEntries(dependencies: AppDependencies, navigator: Navigator) {
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
}

internal fun EntryProviderScope<NavKey>.settingsEntry(chrome: SignedInChrome) {
    val dependencies: AppDependencies = chrome.dependencies
    entry<Destination.Settings> {
        SignedInFrame(
            kind = FrameKind.Place,
            doesScreenReadTown = false,
            chrome = chrome,
        ) {
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
            )
        }
    }
}
