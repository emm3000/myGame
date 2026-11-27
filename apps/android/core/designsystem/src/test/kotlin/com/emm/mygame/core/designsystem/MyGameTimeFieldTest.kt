package com.emm.mygame.core.designsystem

import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameTimeFieldTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val steps: MutableList<String> = mutableListOf()

    private val stepNames: List<String> =
        listOf("One hour earlier", "One hour later", "Five minutes earlier", "Five minutes later")

    private fun recordedStep(label: String, accessibleName: String, recorded: String): MyGameTimeStep =
        MyGameTimeStep(label = MyGameLabel(text = label, translation = null), accessibleName = accessibleName) {
            steps += recorded
        }

    private fun showSevenPm() {
        composeRule.setContent {
            MyGameTheme {
                MyGameTimeField(
                    time = "7:00 PM",
                    hourEarlier = recordedStep("−1 h", "One hour earlier", "hour earlier"),
                    hourLater = recordedStep("+1 h", "One hour later", "hour later"),
                    minutesEarlier = recordedStep("−5 min", "Five minutes earlier", "minutes earlier"),
                    minutesLater = recordedStep("+5 min", "Five minutes later", "minutes later"),
                )
            }
        }
    }

    @Test
    fun `the time field hands each step to its own callback`() {
        showSevenPm()

        stepNames.forEach { name: String ->
            composeRule.onNodeWithContentDescription(name).performClick()
        }

        assertEquals(listOf("hour earlier", "hour later", "minutes earlier", "minutes later"), steps)
    }

    @Test
    fun `each step reads the name the caller gave it`() {
        showSevenPm()

        stepNames.forEach { name: String ->
            composeRule
                .onNodeWithContentDescription(name)
                .assertHasClickAction()
                .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.Text))
        }
    }

    @Test
    fun `the time field announces the time it shows`() {
        showSevenPm()

        composeRule
            .onNodeWithText("7:00 PM")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }
}
