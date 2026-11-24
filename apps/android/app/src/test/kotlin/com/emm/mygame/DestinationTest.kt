package com.emm.mygame

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import kotlinx.serialization.descriptors.elementNames
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class DestinationTest {

    @Test
    fun `keeps every signed-in destination through a serializer round trip`() {
        val signedIn: List<Destination> = listOf(
            Destination.Town,
            Destination.School,
            Destination.Report,
            Destination.News,
            Destination.Settings,
            Destination.Map,
            Destination.Review,
            Destination.LessonWords(LessonId("lesson-2"), walked = listOf(LessonId("lesson-1"))),
            Destination.SchoolText(TextId("text-31")),
            Destination.Placement,
            Destination.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.Eighth),
        )

        val restored: List<Destination> = signedIn.map { destination: Destination ->
            Json.decodeFromString(Destination.serializer(), Json.encodeToString(Destination.serializer(), destination))
        }

        assertEquals(signedIn, restored)
    }

    @Test
    fun `pins the serial name of every destination`() {
        val pinned: Set<String> = setOf(
            "com.emm.mygame.Destination.SignIn",
            "com.emm.mygame.Destination.SignUp",
            "com.emm.mygame.Destination.ForgotPassword",
            "com.emm.mygame.Destination.ResetPassword",
            "com.emm.mygame.Destination.VerifyEmail",
            "com.emm.mygame.Destination.Town",
            "com.emm.mygame.Destination.School",
            "com.emm.mygame.Destination.Report",
            "com.emm.mygame.Destination.News",
            "com.emm.mygame.Destination.Settings",
            "com.emm.mygame.Destination.Map",
            "com.emm.mygame.Destination.Review",
            "com.emm.mygame.Destination.Placement",
            "com.emm.mygame.Destination.HoldoutCheck",
            "com.emm.mygame.Destination.LessonWords",
            "com.emm.mygame.Destination.SchoolText",
        )

        assertEquals(pinned, destinationSerialNames().toSet())
    }

    @Test
    fun `pins the class name every saved back stack holds`() {
        val pinned: Set<String> = setOf(
            "com.emm.mygame.Destination\$SignIn",
            "com.emm.mygame.Destination\$SignUp",
            "com.emm.mygame.Destination\$ForgotPassword",
            "com.emm.mygame.Destination\$ResetPassword",
            "com.emm.mygame.Destination\$VerifyEmail",
            "com.emm.mygame.Destination\$Town",
            "com.emm.mygame.Destination\$School",
            "com.emm.mygame.Destination\$Report",
            "com.emm.mygame.Destination\$News",
            "com.emm.mygame.Destination\$Settings",
            "com.emm.mygame.Destination\$Map",
            "com.emm.mygame.Destination\$Review",
            "com.emm.mygame.Destination\$Placement",
            "com.emm.mygame.Destination\$HoldoutCheck",
            "com.emm.mygame.Destination\$LessonWords",
            "com.emm.mygame.Destination\$SchoolText",
        )

        val notDestinations: List<String> = pinned.filterNot { className: String ->
            Destination::class.java.isAssignableFrom(Class.forName(className))
        }

        assertEquals(emptyList<String>(), notDestinations)
        assertEquals(destinationSerialNames().size, pinned.size)
    }

    private fun destinationSerialNames(): List<String> =
        Destination.serializer().descriptor.getElementDescriptor(1).elementNames.toList()
}
