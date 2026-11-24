package com.emm.mygame.feature.school

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.NAV_ROW_CHEVRON
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.ui.SEASON_MARK_ICON
import com.emm.mygame.core.ui.navRowOf
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolLookTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private val thirdLesson: LessonId = LessonId("lesson-3")

    private val openFirst: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        enteringWordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val openSecond: SchoolUiState.LessonCard =
        openFirst.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val openThird: SchoolUiState.LessonCard =
        openFirst.copy(lesson = thirdLesson, number = 3, theme = "The market")

    private val studiedFirst: SchoolUiState.LessonCard = openFirst.copy(state = SchoolUiState.LessonState.Studied)

    private val studiedSecond: SchoolUiState.LessonCard = openSecond.copy(state = SchoolUiState.LessonState.Studied)

    private val runningFirst: SchoolUiState.LessonCard = openFirst.copy(state = SchoolUiState.LessonState.Studying)

    private val busyOnFirst: SchoolUiState.LessonState.Open =
        SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(name = firstLessonName))

    private val firstRunning: SchoolUiState.SlotLine.Busy =
        SchoolUiState.SlotLine.Busy(firstLesson, firstLessonName, remaining = 90.seconds, total = 150.seconds)

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        schoolLevel = 1,
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(openFirst, openSecond, openThird),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        start = SchoolUiState.LessonRequest.Idle,
        stop = SchoolUiState.LessonRequest.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
    )

    private val secondWhileFirstRuns: SchoolUiState.Content = idleSchool.copy(
        slot = firstRunning,
        lessons = listOf(runningFirst, openSecond.copy(state = busyOnFirst)),
    )

    private val shownFourth: LessonId = LessonId("lesson-4")

    private val everyUnstudiedRow: SchoolUiState.Content = idleSchool.copy(
        slot = firstRunning,
        lessons = listOf(
            runningFirst,
            openSecond.copy(state = busyOnFirst),
            openThird,
            openFirst.copy(lesson = shownFourth, number = 4, theme = "At home"),
        ),
        selected = shownFourth,
    )

    private fun studiedReleased(set: Int): SchoolUiState.ReleasedLessonCard = SchoolUiState.ReleasedLessonCard(
        lesson = LessonId("released-$set"),
        name = LessonName.Released(band = PlacementBand.First, set = set),
        wordCount = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Studied,
    )

    private fun chevronOf(title: String): SemanticsMatcher =
        hasTestTag(NAV_ROW_CHEVRON) and hasAnyAncestor(hasTestTag(LESSON_ROW) and hasAnyDescendant(hasText(title)))

    private val theBlock: SemanticsMatcher = SemanticsMatcher.keyIsDefined(BLOCK_HUE)

    private val inTheBlock: SemanticsMatcher = hasAnyAncestor(theBlock)

    @Test
    fun `draws the study mark directly above the lesson rows`() {
        show(idleSchool.copy(studyMark = SchoolUiState.DurationMark(SeasonKind.Winter, percent = 75)))

        val firstRowTop: Dp = composeRule.onAllNodesWithTag(LESSON_ROW).onFirst().getUnclippedBoundsInRoot().top
        assertTrue(topOf("Lecciones") < topOf(WINTER_STUDY))
        assertTrue(topOf(WINTER_STUDY) < firstRowTop)
    }

    @Test
    fun `names each season on the study mark`() {
        var shown: SchoolUiState by mutableStateOf(idleSchool)
        showLive { shown }

        seasonWords.forEach { (season: SeasonKind, word: String) ->
            shown = idleSchool.copy(studyMark = SchoolUiState.DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNodeWithText("$word: las lecciones tardan el 75 % del tiempo").assertExists()
        }
    }

    @Test
    fun `draws each season's icon beside the study mark`() {
        var shown: SchoolUiState by mutableStateOf(idleSchool)
        showLive { shown }

        seasonIcons.forEach { (season: SeasonKind, icon: ImageVector) ->
            shown = idleSchool.copy(studyMark = SchoolUiState.DurationMark(season, percent = 75))
            composeRule.waitForIdle()

            composeRule.onNode(
                SemanticsMatcher.expectValue(SEASON_MARK_ICON, icon) and
                    hasAnyDescendant(hasText("las lecciones tardan el 75 % del tiempo", substring = true)),
            ).assertExists()
        }
    }

    @Test
    fun `draws no study mark while the overview answers none`() {
        show(idleSchool)

        composeRule.onAllNodesWithText(WINTER_STUDY).assertCountEquals(0)
    }

    @Test
    fun `puts the next lesson in a block with its pill under it`() {
        show(idleSchool)

        composeRule.onNode(hasText("Lección 1") and theBlock).assertExists()
        val blockBottom: Dp = composeRule.onNode(theBlock)
            .getUnclippedBoundsInRoot().bottom
        val pillTop: Dp = composeRule.onNodeWithTag(OUTLINED_PILL).getUnclippedBoundsInRoot().top
        assertTrue(blockBottom <= pillTop)
        composeRule.onAllNodes(hasTestTag(OUTLINED_PILL) and inTheBlock).assertCountEquals(0)
    }

    @Test
    fun `sets the lesson in display and its theme in reading on the block's ink`() {
        val (ink: Color, muted: Color) = showReadingBlockInks(idleSchool.copy(lessons = listOf(openFirst)))

        assertEquals(40.sp, textStyleOf(composeRule, "Lección 1").fontSize)
        assertEquals(ink, textStyleOf(composeRule, "Lección 1").color)
        assertEquals(20.sp, textStyleOf(composeRule, "A day in town").fontSize)
        assertEquals(muted, textStyleOf(composeRule, "5 palabras · Habilidad: comida +5\u00A0%").color)
    }

    @Test
    fun `takes the block's hue from the lesson's place in the curriculum`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, studiedSecond, openThird)))

        composeRule.onNode(
            hasText("Lección 3") and SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Periwinkle),
        ).assertExists()
    }

    @Test
    fun `opens the block on the first open lesson past a running one`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasText("Lección 2") and theBlock).assertExists()
    }

    @Test
    fun `shows the running lesson in the block when no other is open`() {
        show(idleSchool.copy(slot = firstRunning, lessons = listOf(runningFirst, studiedSecond)))

        composeRule.onNode(hasText("Lección 1") and theBlock).assertExists()
        composeRule.onNode(hasText("En estudio") and theBlock).assertExists()
    }

    @Test
    fun `sets the running lesson's mark in its block in caption on the block's muted ink`() {
        val (_, muted: Color) = showReadingBlockInks(
            idleSchool.copy(slot = firstRunning, lessons = listOf(runningFirst, studiedSecond)),
        )

        val mark: TextStyle = textStyleOf(composeRule, hasText("En estudio") and inTheBlock)
        assertEquals(15.sp, mark.fontSize)
        assertEquals(FontWeight.Normal, mark.fontWeight)
        assertEquals(muted, mark.color)
    }

    @Test
    fun `draws the learning load under the pill and the rows under the load`() {
        show(idleSchool)

        val pillBottom: Dp = composeRule.onNodeWithTag(OUTLINED_PILL).getUnclippedBoundsInRoot().bottom
        val loadTop: Dp = composeRule.onNodeWithText("Palabras en aprendizaje: 0 de 10")
            .getUnclippedBoundsInRoot().top
        val rowsTop: Dp = composeRule.onNodeWithText("Lecciones").getUnclippedBoundsInRoot().top
        assertTrue(pillBottom <= loadTop)
        assertTrue(loadTop < rowsTop)
    }

    @Test
    fun `ends each of the other lessons' rows on a hairline`() {
        show(idleSchool)

        composeRule.onNodeWithText("Lección 2").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Lección 3").performScrollTo().assertIsDisplayed()
        composeRule.onAllNodesWithTag(HAIRLINE, useUnmergedTree = true).assertCountEquals(2)
    }

    @Test
    fun `sets released lessons after a lesson row with one hairline between each`() {
        show(
            idleSchool.copy(
                lessons = listOf(openFirst, openSecond),
                releasedLessons = listOf(studiedReleased(set = 1), studiedReleased(set = 2)),
            ),
        )

        composeRule.onAllNodesWithTag(HAIRLINE, useUnmergedTree = true).assertCountEquals(2)
    }

    @Test
    fun `draws every unstudied lesson's row as a door`() {
        show(everyUnstudiedRow)

        listOf("Lección 1", "Lección 2", "Lección 3").forEach { title: String ->
            composeRule.onNode(chevronOf(title), useUnmergedTree = true).assertExists()
        }
    }

    @Test
    fun `marks the running lesson's row as under study`() {
        show(everyUnstudiedRow)

        composeRule
            .onNode(
                hasText("En estudio") and
                    hasAnyAncestor(hasTestTag(LESSON_ROW) and hasAnyDescendant(hasText("Lección 1"))),
                useUnmergedTree = true,
            )
            .assertExists()
    }

    @Test
    fun `selects a blocked lesson from its row`() {
        show(everyUnstudiedRow)

        composeRule.onNode(hasText("Lección 2") and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(secondLesson)), intents)
    }

    @Test
    fun `draws no chevron on a studied row`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, openSecond, openThird)))

        composeRule.onNode(chevronOf("Lección 1"), useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `selects a lesson from its row`() {
        show(idleSchool)

        composeRule.onNodeWithText("Lección 2").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(secondLesson)), intents)
    }

    @Test
    fun `selects the running lesson from its row`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasText("Lección 1") and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(firstLesson)), intents)
    }

    @Test
    fun `keeps a studied row plain`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, openSecond)))

        composeRule.onNode(hasText("Lección 1") and hasClickAction()).assertDoesNotExist()
        composeRule.onNodeWithText("Estudiada").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `gives a selected row the block`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNode(hasText("Lección 3") and theBlock).assertExists()
    }

    @Test
    fun `gives a selected row the pill`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNode(hasTestTag(OUTLINED_PILL) and hasText("Estudiar la lección 3 · 2:30")).assertExists()
    }

    @Test
    fun `keeps the hue of a selected lesson's place`() {
        show(idleSchool.copy(selected = secondLesson))

        composeRule.onNode(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint)).assertExists()
    }

    @Test
    fun `moves the lesson the block left down to the rows`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNodeWithText("Lección 1").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(firstLesson)), intents)
    }

    @Test
    fun `brings the block back into view on a selection`() {
        var state: SchoolUiState by mutableStateOf(idleSchool)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { },
                    onLessonOpen = { },
                    onTextOpen = {},
                )
            }
        }
        composeRule.onNodeWithText("Aún no tienes habilidades.").performScrollTo()

        state = idleSchool.copy(selected = thirdLesson)

        composeRule.onNode(hasText("Lección 3") and theBlock).assertIsDisplayed()
    }

    @Test
    fun `quiets the study pill while a lesson runs`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasTestTag(OUTLINED_PILL) and hasText("Estudiar la lección 2 · 2:30")).assertExists()
    }

    @Test
    fun `names the running lesson on the nav row while the block shows another`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(navRowOf("Lección 1 · Leer las palabras"), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `opens the running lesson from the nav row under another lesson's block`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(navRowOf("Lección 1 · Leer las palabras"), useUnmergedTree = true).performClick()

        assertEquals(listOf(firstLesson), lessonOpens)
    }

    @Test
    fun `leaves the running lesson unnamed on the nav row under its own block`() {
        show(secondWhileFirstRuns.copy(selected = firstLesson))

        composeRule.onNode(navRowOf("Leer las palabras"), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `keeps the nav row on a lesson that finished while the town reads again`() {
        show(secondWhileFirstRuns.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName)))

        composeRule.onNode(navRowOf("Lección 1 · Leer las palabras"), useUnmergedTree = true).assertExists()
    }

    @Test
    fun `sets the stop control beside the slot as a secondary pill`() {
        show(secondWhileFirstRuns)

        composeRule
            .onNode(hasTestTag(OUTLINED_PILL) and hasContentDescription("Parar el estudio de la lección 1"))
            .assertExists()
    }

    @Test
    fun `sets a running lesson's countdown in heading`() {
        show(secondWhileFirstRuns)

        assertEquals(20.sp, textStyleOf(composeRule, "1\u00A0min").fontSize)
    }

    @Test
    fun `sets a running lesson's countdown in tabular figures`() {
        show(secondWhileFirstRuns)

        assertEquals("tnum", textStyleOf(composeRule, "1\u00A0min").fontFeatureSettings)
    }

    @Test
    fun `carries its icon on a done line`() {
        show(idleSchool.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, firstLessonName)))

        composeRule.onNodeWithTag(LESSON_DONE_ICON, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no done icon on a running lesson`() {
        show(secondWhileFirstRuns)

        composeRule.onAllNodesWithTag(LESSON_DONE_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `says why the next lesson is locked in warning ink`() {
        val locked: SchoolUiState.LessonState.Open =
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2))
        var warningInk: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                warningInk = MyGameTheme.colors.warningInk
                SchoolScreen(
                    state = idleSchool.copy(lessons = listOf(openFirst.copy(state = locked))),
                    onIntent = { },
                    onLessonOpen = { },
                    onTextOpen = {},
                )
            }
        }

        assertEquals(warningInk, textStyleOf(composeRule, "Necesita la escuela en nivel 2").color)
    }

    @Test
    fun `sets the school's name in display`() {
        show(idleSchool)

        assertEquals(40.sp, textStyleOf(composeRule, "Escuela").fontSize)
    }

    private fun showReadingBlockInks(state: SchoolUiState): Pair<Color, Color> {
        var inks: Pair<Color, Color> = Color.Unspecified to Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inks = MyGameTheme.colors.onBlock to MyGameTheme.colors.onBlockMuted
                SchoolScreen(
                    state = state,
                    onIntent = { },
                    onLessonOpen = { },
                    onTextOpen = {},
                )
            }
        }
        composeRule.waitForIdle()
        return inks
    }

    private fun topOf(text: String): Dp = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot().top

    private fun show(state: SchoolUiState) {
        showLive { state }
    }

    private fun showLive(state: () -> SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state(),
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onTextOpen = {},
                )
            }
        }
    }

    private companion object {
        const val WINTER_STUDY: String = "Invierno: las lecciones tardan el 75 % del tiempo"

        val seasonWords: Map<SeasonKind, String> = mapOf(
            SeasonKind.Spring to "Primavera",
            SeasonKind.Summer to "Verano",
            SeasonKind.Fall to "Otoño",
            SeasonKind.Winter to "Invierno",
        )

        val seasonIcons: Map<SeasonKind, ImageVector> = mapOf(
            SeasonKind.Spring to MyGameIcons.spring,
            SeasonKind.Summer to MyGameIcons.summer,
            SeasonKind.Fall to MyGameIcons.fall,
            SeasonKind.Winter to MyGameIcons.winter,
        )
    }
}
