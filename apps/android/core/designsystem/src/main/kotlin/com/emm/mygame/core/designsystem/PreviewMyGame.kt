package com.emm.mygame.core.designsystem

import android.content.res.Configuration
import androidx.compose.ui.tooling.preview.Preview

private const val PHONE_WIDTH_DP: Int = 360

private const val LARGE_FONT_SCALE: Float = 1.5f

private const val LARGEST_FONT_SCALE: Float = 2.0f

@Preview(name = "Day", widthDp = PHONE_WIDTH_DP, uiMode = Configuration.UI_MODE_NIGHT_NO)
@Preview(name = "Night", widthDp = PHONE_WIDTH_DP, uiMode = Configuration.UI_MODE_NIGHT_YES)
@Preview(
    name = "Day, large font",
    widthDp = PHONE_WIDTH_DP,
    uiMode = Configuration.UI_MODE_NIGHT_NO,
    fontScale = LARGE_FONT_SCALE,
)
@Preview(
    name = "Day, largest font",
    widthDp = PHONE_WIDTH_DP,
    uiMode = Configuration.UI_MODE_NIGHT_NO,
    fontScale = LARGEST_FONT_SCALE,
)
annotation class PreviewMyGame
