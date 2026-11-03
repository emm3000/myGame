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
    val wood: ImageVector = strokedIcon(
        name = "wood",
        "M4.5 8.2c-1.6.3-1.7 7.1 0 7.5l13.6.6c.9-.8 1.2-6.6.3-8.1z",
        "M16.5 12.1a2.1 4 0 1 0 4.2 0a2.1 4 0 1 0 -4.2 0z",
        "M18.6 10.4c-.5.4-.6 2.9 0 3.4M8 9.3l.4 5.6M12.4 8.9l-.3 6.2",
    )
    val stone: ImageVector = strokedIcon(
        name = "stone",
        "M5.2 9.6 8.9 5.3l7.2-.6 3.6 4.1-.9 7.6-5.1 2.6-8.1-1.9z",
        "M8.9 5.3l1.6 4.2 7.8.1M10.5 9.5l-2.1 7.7M10.5 9.5l7.1 7.5",
    )
    val iron: ImageVector = strokedIcon(
        name = "iron",
        "M3.6 15.8 6.4 8.7h11.1l2.9 7.1c-5.6.9-11.2.9-16.8 0z",
        "M6.4 8.7c3.8-.8 7.4-.8 11.1 0M9.2 12.3h5.4",
    )
    val gold: ImageVector = strokedIcon(
        name = "gold",
        "M12 3.6c4.7-.1 8.4 3.8 8.3 8.4-.1 4.5-3.8 8.3-8.4 8.3-4.5-.1-8.2-3.8-8.2-8.4" +
            "C3.7 7.3 7.4 3.7 12 3.6z",
        "M12 6.9c2.8 0 5 2.3 5 5.1 0 2.8-2.3 5-5.1 5-2.7 0-5-2.3-4.9-5.1 0-2.7 2.3-5 5-5z",
        "M9.6 13.6V9.9l2.4 2.1 2.4-2.1v3.7",
    )
    val food: ImageVector = strokedIcon(
        name = "food",
        "M12 21.2c.2-6.3.1-11.6-.4-16.8",
        "M11.6 4.4c-2 .4-3.1 2.2-3.2 4 1.9-.3 3.1-1.8 3.2-4z",
        "M12 8.8c-2.1.4-3.4 2.3-3.5 4.2 2-.4 3.3-1.9 3.5-4.2z",
        "M12.2 13.3c-2.1.4-3.5 2.4-3.6 4.3 2.1-.4 3.4-2 3.6-4.3z",
        "M11.8 4.5c2 .4 3.1 2.2 3.1 4-1.9-.3-3-1.9-3.1-4z",
        "M12.1 8.9c2.1.4 3.4 2.3 3.4 4.2-2-.4-3.3-1.9-3.4-4.2z",
        "M12.3 13.4c2.1.4 3.4 2.4 3.5 4.3-2.1-.4-3.4-2-3.5-4.3z",
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
