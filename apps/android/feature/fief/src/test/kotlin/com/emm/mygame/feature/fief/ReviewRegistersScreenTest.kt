package com.emm.mygame.feature.fief

import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameRegisteredRow
import com.emm.mygame.core.designsystem.MyGameRegistering
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.REGISTERING
import com.emm.mygame.core.network.TownResourceKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private val dealtSchool: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
    walked = 1,
    dueCount = 2,
    card = ReviewUiState.ReviewCard.Recognition(
        wordId = schoolRecognition.wordId,
        word = schoolRecognition.word,
        frame = schoolRecognition.frame,
        choices = schoolRecognition.choices,
        chosen = null,
    ),
    step = ReviewUiState.ReviewStep.Answering,
    isDealtFromStack = true,
)

private val skillEarned: ReviewUiState.Reviewing = dealtSchool.copy(
    isDealtFromStack = false,
    step = ReviewUiState.ReviewStep.Correct(
        skill = ReviewUiState.SkillLine(
            resource = TownResourceKind.Food,
            level = 2,
            ratePercent = 5,
            rates = ReviewUiState.SkillRates(before = 18, after = 19),
            words = listOf("home", "school"),
        ),
    ),
)

@RunWith(RobolectricTestRunner::class)
class ReviewRegistersScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `deals the next card on a right answer`() {
        drawInFlight(dealtSchool)

        assertInFlight(MyGameRegisteredRow.Deal)
    }

    @Test
    fun `changes the card in place after a wrong answer`() {
        drawInFlight(dealtSchool.copy(isDealtFromStack = false))

        assertEquals(emptyList<MyGameRegistering>(), registeringNodesOf(composeRule))
    }

    @Test
    fun `stacks the next hues behind the card`() {
        drawInFlight(dealtSchool.copy(dueCount = 5))

        assertEquals(
            listOf(MyGameBlockHue.Lavender, MyGameBlockHue.Periwinkle, MyGameBlockHue.Mint),
            blockHues(),
        )
    }

    @Test
    fun `stacks no more cards than are due after this one`() {
        drawInFlight(dealtSchool.copy(dueCount = 1))

        assertEquals(listOf(MyGameBlockHue.Mint), blockHues())
    }

    @Test
    fun `changes the rate with the skill verdict`() {
        drawInFlight(skillEarned)

        assertInFlight(MyGameRegisteredRow.Rate)
    }

    @Test
    fun `speaks each row once`() {
        drawInFlight(skillEarned)

        assertEquals(1, liveNodesHolding("+19 / h").size)
    }

    private fun drawInFlight(state: ReviewUiState) {
        composeRule.mainClock.autoAdvance = false
        drawReview(composeRule, state)
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()
    }

    private fun assertInFlight(row: MyGameRegisteredRow) {
        val registering: MyGameRegistering = registeringNodesOf(composeRule).single()
        assertEquals(row, registering.row)
        assertTrue(registering.fraction < 1f)
    }

    private fun blockHues(): List<MyGameBlockHue> =
        composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(BLOCK_HUE), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { node -> node.config[BLOCK_HUE] }

    private fun liveNodesHolding(text: String): List<Any> =
        composeRule.onAllNodes(
            SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion) and hasText(text, substring = true),
        ).fetchSemanticsNodes()
}

@RunWith(RobolectricTestRunner::class)
class ReviewRegistersAtScaleZeroTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule(effectContext = scaledToZero)

    @Test
    fun `lands each row at once at animator scale 0`() {
        composeRule.mainClock.autoAdvance = false
        drawReview(composeRule, skillEarned.copy(isDealtFromStack = true))

        assertEquals(
            setOf(MyGameRegisteredRow.Deal to 1f, MyGameRegisteredRow.Rate to 1f),
            registeringNodesOf(composeRule).map { registering -> registering.row to registering.fraction }.toSet(),
        )
    }

    private companion object {
        val scaledToZero: MotionDurationScale = object : MotionDurationScale {
            override val scaleFactor: Float = 0f
        }
    }
}

private fun drawReview(composeRule: ComposeContentTestRule, state: ReviewUiState) {
    composeRule.setContent {
        MyGameTheme {
            ReviewScreen(state = state, onIntent = { }, onLessonOpen = { }, onTownOpen = { })
        }
    }
}

private fun registeringNodesOf(composeRule: ComposeContentTestRule): List<MyGameRegistering> =
    composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
        .fetchSemanticsNodes()
        .map { node -> node.config[REGISTERING] }
