package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.model.account.EmailVerificationToken
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination : NavKey {

    @Serializable
    data class SignIn(val isSessionEnded: Boolean) : Destination

    @Serializable
    data object SignUp : Destination

    @Serializable
    data object ForgotPassword : Destination

    @Serializable
    sealed interface MailedLink : Destination

    @Serializable
    data class ResetPassword(val token: PasswordResetToken?) : MailedLink

    @Serializable
    data class VerifyEmail(val token: EmailVerificationToken?) : MailedLink

    @Serializable
    data object Naming : Destination

    @Serializable
    data object Today : Destination

    @Serializable
    data object Town : Destination

    @Serializable
    data class Place(val building: TownBuildingKind) : Destination

    @Serializable
    data object School : Destination

    @Serializable
    data object Report : Destination

    @Serializable
    data object News : Destination

    @Serializable
    data object Settings : Destination

    @Serializable
    data object Map : Destination

    @Serializable
    data object Review : Destination

    @Serializable
    data object Placement : Destination

    @Serializable
    data class HoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : Destination

    @Serializable
    data class LessonWords(val lesson: LessonId, val walked: List<LessonId>) : Destination

    @Serializable
    data class SchoolText(val text: TextId) : Destination
}
