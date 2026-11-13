package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameNextStepBlock(
    title: String,
    line: String,
    detail: String?,
    modifier: Modifier = Modifier,
    countdown: @Composable () -> Unit = {},
) {
    MyGameNextStepBlock(
        title = MyGameLabel(text = title, translation = null),
        line = MyGameLabel(text = line, translation = null),
        detail = detail?.let { shown: String -> MyGameLabel(text = shown, translation = null) },
        modifier = modifier,
        countdown = countdown,
    )
}

@Composable
fun MyGameNextStepBlock(
    title: MyGameLabel,
    line: MyGameLabel,
    detail: MyGameLabel?,
    modifier: Modifier = Modifier,
    countdown: @Composable () -> Unit = {},
) {
    MyGameBlock(
        hue = MyGameBlockHue.Peach,
        modifier = modifier.semantics(mergeDescendants = true) { },
    ) {
        MyGameMetaText(
            label = title,
            color = MyGameTheme.colors.onBlockMuted,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(label = line, style = MyGameTypography.display, color = MyGameTheme.colors.onBlock)
        detail?.let { shown: MyGameLabel ->
            MyGameText(label = shown, style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
        }
        countdown()
    }
}

@PreviewMyGame
@Composable
private fun MyGameNextStepBlockPreview() {
    MyGamePreviewSurface {
        MyGameNextStepBlock(
            title = "Next step",
            line = "Study lesson 2",
            detail = "Five new words wait at the school.",
        ) {
            MyGameCountdownLine(words = "Ready in", time = "04:05", ground = MyGameCountdownGround.Block)
        }
        MyGameNextStepBlock(title = "Next step", line = "Review your words", detail = null)
        MyGameNextStepBlock(
            title = MyGameLabel(text = "Next step", translation = "Siguiente paso"),
            line = MyGameLabel(text = "Study lesson 2", translation = "Estudia la lección 2"),
            detail = MyGameLabel(
                text = "Five new words wait at the school.",
                translation = "Cinco palabras nuevas te esperan en la escuela.",
            ),
        )
    }
}
