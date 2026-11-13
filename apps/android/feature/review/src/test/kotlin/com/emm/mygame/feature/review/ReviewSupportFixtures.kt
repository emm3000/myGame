package com.emm.mygame.feature.review

import com.emm.mygame.core.network.DueReview
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.WordSupport

internal fun supportOf(shown: WordSupport.Shown, text: String, language: WordSupport.Language): WordSupport =
    WordSupport(shown = shown, text = text, language = language)

internal val caminarBeside: WordSupport =
    supportOf(WordSupport.Shown.Beside, "caminar", WordSupport.Language.Spanish)

internal val caminarOnTap: WordSupport =
    supportOf(WordSupport.Shown.OnTap, "caminar", WordSupport.Language.Spanish)

internal val walkDefinitionOnTap: WordSupport =
    supportOf(WordSupport.Shown.OnTap, "to move on foot", WordSupport.Language.English)

internal val irOnTap: WordSupport = supportOf(WordSupport.Shown.OnTap, "ir", WordSupport.Language.Spanish)

internal fun walkFrame(support: WordSupport): List<FrameSpan> = listOf(
    FrameSpan(text = "The kids ", support = null),
    FrameSpan(text = "walk", support = support),
    FrameSpan(text = " to school.", support = null),
)

internal fun walkRecognition(support: WordSupport): DueReview.Recognition =
    schoolRecognition.copy(frame = walkFrame(support))

internal val goesRecall: DueReview.Recall = homeRecall.copy(
    gappedFrame = listOf(
        FrameSpan(text = "She ", support = null),
        FrameSpan(text = "goes", support = irOnTap),
        FrameSpan(text = " ___ at six.", support = null),
    ),
)

internal val withheldLikeRecognition: DueReview.Recognition = schoolRecognition.copy(
    word = "this",
    frame = listOf(
        FrameSpan(text = "Things like this ", support = null),
        FrameSpan(text = "go", support = irOnTap),
        FrameSpan(text = " on in many towns.", support = null),
    ),
)
