package com.emm.mygame.feature.fief

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import com.emm.mygame.core.designsystem.MyGameRegistering
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.REGISTERING
import com.emm.mygame.core.network.TownResourceKind

internal val dealtSchool: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
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

internal val skillEarned: ReviewUiState.Reviewing = dealtSchool.copy(
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

internal fun drawReview(composeRule: ComposeContentTestRule, state: ReviewUiState) {
    composeRule.setContent {
        MyGameTheme {
            ReviewScreen(state = state, onIntent = { }, onLessonOpen = { }, onTownOpen = { })
        }
    }
}

internal fun registeringNodesOf(composeRule: ComposeContentTestRule): List<MyGameRegistering> =
    composeRule.onAllNodes(SemanticsMatcher.keyIsDefined(REGISTERING), useUnmergedTree = true)
        .fetchSemanticsNodes()
        .map { node -> node.config[REGISTERING] }
