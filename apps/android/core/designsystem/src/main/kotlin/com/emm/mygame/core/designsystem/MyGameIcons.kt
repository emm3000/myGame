package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

object MyGameIcons {
    val hourglass: ImageVector = strokedIcon(
        name = "hourglass",
        "M6.5 3.4h11M6.5 20.6h11",
        "M7.6 3.6c-.2 3.6 1.3 6.4 4.3 8.3 3-1.9 4.5-4.7 4.3-8.3M7.6 20.4c-.2-3.6 1.3-6.4 4.3-8.3 " +
            "3 1.9 4.5 4.7 4.3 8.3",
        "M9.6 6.8c1.6.4 3.1.4 4.7 0M9.3 19.1c1.8-.6 3.6-.6 5.4 0",
    )
    val alert: ImageVector = strokedIcon(
        name = "alert",
        "M12 3.9c4.5-.1 8.2 3.6 8.1 8.1-.1 4.4-3.7 8.1-8.2 8.1-4.4-.1-8-3.7-8-8.2.1-4.4 3.7-8 8.1-8z",
        "M12 7.6v5.6M12 16.2v.1",
    )
}

private const val VIEWPORT: Float = 24f

private fun strokedIcon(name: String, vararg paths: String): ImageVector {
    val builder: ImageVector.Builder = ImageVector.Builder(
        name = name,
        defaultWidth = VIEWPORT.dp,
        defaultHeight = VIEWPORT.dp,
        viewportWidth = VIEWPORT,
        viewportHeight = VIEWPORT,
    )
    paths.forEach { path ->
        builder.addPath(
            pathData = PathParser().parsePathString(path).toNodes(),
            stroke = SolidColor(Color.Black),
            strokeLineWidth = MyGameStrokeWidths.ICON,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        )
    }
    return builder.build()
}
