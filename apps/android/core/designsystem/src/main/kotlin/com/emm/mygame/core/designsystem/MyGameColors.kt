package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

@Immutable
data class MyGameColors(
    val surface: Color,
    val surfaceRaised: Color,
    val surfaceSunken: Color,
    val line: Color,
    val lineStrong: Color,
    val ink: Color,
    val inkMuted: Color,
    val action: Color,
    val onAction: Color,
    val focus: Color,
    val warningInk: Color,
    val warningSoft: Color,
    val destructiveInk: Color,
    val destructiveSoft: Color,
    val blockPeach: Color,
    val blockMint: Color,
    val blockPeriwinkle: Color,
    val blockLavender: Color,
    val onBlock: Color,
    val onBlockMuted: Color,
)

internal val lightColors: MyGameColors = MyGameColors(
    surface = Color(0xFFF4F3F1),
    surfaceRaised = Color(0xFFFBFAF9),
    surfaceSunken = Color(0xFFE9E7E3),
    line = Color(0xFFDAD9D8),
    lineStrong = Color(0xFF858389),
    ink = Color(0xFF15141A),
    inkMuted = Color(0xFF5F5D65),
    action = Color(0xFF15141A),
    onAction = Color(0xFFF4F3F1),
    focus = Color(0xFF15141A),
    warningInk = Color(0xFF7F5210),
    warningSoft = Color(0xFFF3E6C8),
    destructiveInk = Color(0xFFA33A3A),
    destructiveSoft = Color(0xFFF3DADA),
    blockPeach = Color(0xFFF5C9A8),
    blockMint = Color(0xFFBFE3CB),
    blockPeriwinkle = Color(0xFFC6D3F5),
    blockLavender = Color(0xFFDCC8F0),
    onBlock = Color(0xFF15141A),
    onBlockMuted = Color(0xFF45444C),
)

internal val darkColors: MyGameColors = MyGameColors(
    surface = Color(0xFF15141A),
    surfaceRaised = Color(0xFF1E1D24),
    surfaceSunken = Color(0xFF2B2A32),
    line = Color(0xFF2E2D35),
    lineStrong = Color(0xFF85838C),
    ink = Color(0xFFF4F3F1),
    inkMuted = Color(0xFFAEACB4),
    action = Color(0xFFF4F3F1),
    onAction = Color(0xFF15141A),
    focus = Color(0xFFF4F3F1),
    warningInk = Color(0xFFE8BF74),
    warningSoft = Color(0xFF3A2E16),
    destructiveInk = Color(0xFFF0A6A6),
    destructiveSoft = Color(0xFF3F2224),
    blockPeach = Color(0xFFF5C9A8),
    blockMint = Color(0xFFBFE3CB),
    blockPeriwinkle = Color(0xFFC6D3F5),
    blockLavender = Color(0xFFDCC8F0),
    onBlock = Color(0xFF15141A),
    onBlockMuted = Color(0xFF45444C),
)
