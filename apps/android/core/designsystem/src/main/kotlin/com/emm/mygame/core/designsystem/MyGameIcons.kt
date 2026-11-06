package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.dp

object MyGameIcons {
    val back: ImageVector = strokedIcon(name = "back", "m15 6-6 6 6 6")
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
    val slot: ImageVector = strokedIcon(
        name = "slot",
        "M4.3 5.1c5.1-.6 10.2-.6 15.3 0 .4 4.6.4 9.2 0 13.8-5.1.5-10.2.5-15.3 0-.4-4.6-.4-9.2 0-13.8z",
        "M4.6 5.3 19.3 18.7M19.4 5.3 4.7 18.8",
        "M8.1 3.2v2M15.9 3.2v2",
    )
    val march: ImageVector = strokedIcon(
        name = "march",
        "M8.4 21.4c.1-5.2.1-10.3.2-15.5",
        "M8.6 7.3c3.1-.2 6.2-.2 9.3 0l2.5 1.9-2.5 1.9c-3.1.2-6.2.2-9.3 0z",
        "M4.4 21.3c2.7-.3 5.4-.3 8.1 0",
        "M6.6 4.1c1.3-.4 2.6-.4 3.9 0",
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
    val money: ImageVector = strokedIcon(
        name = "money",
        "M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
        "M9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z",
        "M6.5 9.5v5M17.5 9.5v5",
    )
    val power: ImageVector = strokedIcon(name = "power", "M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z")
    val material: ImageVector = strokedIcon(
        name = "material",
        "M4.5 5h15a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5z",
        "M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M12 9.7v4.6M8 14.3V19M16 14.3V19",
    )
    val people: ImageVector = strokedIcon(
        name = "people",
        "M6 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0z",
        "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6",
        "M14.5 9a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0z",
        "M16.5 14c2.6.3 4.5 2.6 4.5 5.5",
    )
    val check: ImageVector = strokedIcon(name = "check", "m5 12.5 4.5 4.5L19 7")
    val spring: ImageVector = strokedIcon(
        name = "spring",
        "M12.1 20.7c.2-4.3.1-8.1-.4-11.3",
        "M11.7 9.6c-3.5-.3-5.8 1.8-6.6 5.1 3.4.4 5.9-1.6 6.6-5.1z",
        "M12 12.9c.3-3.9 2.8-6.1 6.7-6.4-.2 3.8-2.7 6.2-6.7 6.4z",
        "M6.2 20.8c3.8-.5 7.7-.5 11.6 0",
    )
    val summer: ImageVector = strokedIcon(
        name = "summer",
        "M12 7.7c2.4-.1 4.3 1.8 4.3 4.2 0 2.4-1.9 4.3-4.4 4.3-2.4-.1-4.2-2-4.2-4.4 0-2.3 1.9-4.1 4.3-4.1z",
        "M12 2.9v2.2M12 18.9v2.2M2.9 12h2.2M18.9 12h2.2M5.6 5.7l1.6 1.5M16.8 16.8l1.6 1.5" +
            "M5.6 18.3l1.6-1.5M16.8 7.2l1.6-1.5",
    )
    val fall: ImageVector = strokedIcon(
        name = "fall",
        "M5.3 18.7C5 11.4 9.7 6.3 18.9 5.2c.9 9.2-4.1 14-13.6 13.5z",
        "M5.5 18.5c3.2-4.5 7.3-8.2 12.3-11.3",
        "M9.2 14.5c1.8.2 3.5.1 5.1-.4M11.9 10.8c1.5.2 2.9.1 4.2-.3",
        "M5.4 18.6c-.6.8-1.1 1.6-1.5 2.4",
    )
    val winter: ImageVector = strokedIcon(
        name = "winter",
        "M12 3.4v17.2M4.6 7.7l14.8 8.6M4.6 16.3l14.8-8.6",
        "M9.8 5.3 12 7.2l2.2-1.9M9.8 18.7 12 16.8l2.2 1.9M5.2 10.9l2.7-.9.1-2.9M18.8 13.1l-2.7.9-.1 2.9" +
            "M5.2 13.1l2.7.9.1 2.9M18.8 10.9l-2.7-.9-.1-2.9",
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
