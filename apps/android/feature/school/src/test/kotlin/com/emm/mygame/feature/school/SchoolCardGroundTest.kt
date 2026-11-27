package com.emm.mygame.feature.school

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolCardGroundTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var sunken: Color = Color.Unspecified

    private val laterLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = secondLesson,
        number = 2,
        theme = "Work and money",
        wordCount = 5,
        enteringWordCount = 5,
        resource = TownResourceKind.Money,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val laterSchool: SchoolUiState.Content = SchoolUiState.Content(
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = listOf(
            SchoolUiState.SkillLine(
                lesson = secondLesson,
                resource = TownResourceKind.Money,
                level = 1,
                ratePercent = 5,
            ),
        ),
        lessons = listOf(laterLesson),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        start = SchoolUiState.LessonRequestStatus.Idle,
        stop = SchoolUiState.LessonRequestStatus.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
        reviews = SchoolUiState.ReviewsLine.Due(count = 3, readFirst = null),
    )

    @Test
    fun `draws the next-step card on surface-sunken in the light theme`() {
        show(darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(SHOWN_LESSON_CARD))
    }

    @Test
    fun `draws the next-step card on surface-sunken in the dark theme`() {
        show(darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(SHOWN_LESSON_CARD))
    }

    @Test
    fun `draws the reviews row on surface-sunken in the light theme`() {
        show(darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(REVIEWS_ROW))
    }

    @Test
    fun `draws the reviews row on surface-sunken in the dark theme`() {
        show(darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(REVIEWS_ROW))
    }

    @Test
    fun `draws the learning card on surface-sunken in the light theme`() {
        show(darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(LEARNING_CARD))
    }

    @Test
    fun `draws the learning card on surface-sunken in the dark theme`() {
        show(darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(LEARNING_CARD))
    }

    @Test
    fun `draws the skills on surface-sunken in the light theme`() {
        show(darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(SKILLS_CARD))
    }

    @Test
    fun `draws the skills on surface-sunken in the dark theme`() {
        show(darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(SKILLS_CARD))
    }

    private fun show(darkTheme: Boolean) {
        composeRule.setContent {
            MyGameTheme(darkTheme = darkTheme) {
                sunken = MyGameTheme.colors.surfaceSunken
                SchoolScreen(
                    state = laterSchool,
                    onIntent = {},
                    onLessonOpen = {},
                    onTextOpen = {},
                    onReviewsOpen = {},
                )
            }
        }
    }

    private fun mostDrawnColorOf(tag: String): Int {
        val image: ImageBitmap = composeRule.onNodeWithTag(tag).performScrollTo().captureToImage()
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels.toList()
            .groupingBy { pixel: Int -> pixel }
            .eachCount()
            .maxBy { entry: Map.Entry<Int, Int> -> entry.value }
            .key
    }
}
