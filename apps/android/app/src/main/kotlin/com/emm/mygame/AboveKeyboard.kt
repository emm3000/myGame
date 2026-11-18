package com.emm.mygame

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.PointerKeyboardModifiers
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.WindowInfo
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.toSize

@Composable
internal fun AboveKeyboard(isKeyboardOpen: Boolean, dock: @Composable () -> Unit) {
    val density: Density = LocalDensity.current
    val keyboardHeight: Int = WindowInsets.ime.getBottom(density)
    val window: WindowInfo = LocalWindowInfo.current
    val room: WindowInfo = remember(window, keyboardHeight, density) {
        RoomAboveKeyboard(window, keyboardHeight, density)
    }
    CompositionLocalProvider(LocalWindowInfo provides room) {
        Layout(
            content = dock,
            modifier = Modifier.windowInsetsPadding(WindowInsets.ime.only(WindowInsetsSides.Bottom)),
        ) { measurables: List<Measurable>, constraints: Constraints ->
            val placeables: List<Placeable> = measurables.map { measurable: Measurable ->
                measurable.measure(constraints.copy(minHeight = 0))
            }
            val height: Int = placeables.maxOfOrNull(Placeable::height) ?: 0
            val width: Int = placeables.maxOfOrNull(Placeable::width) ?: constraints.minWidth
            if (isKeyboardOpen && height > room.containerSize.height / 2) return@Layout layout(width, 0) {}
            layout(width, height) { placeables.forEach { placeable: Placeable -> placeable.place(0, 0) } }
        }
    }
}

private class RoomAboveKeyboard(
    private val window: WindowInfo,
    private val keyboardHeight: Int,
    private val density: Density,
) : WindowInfo {
    override val isWindowFocused: Boolean
        get() = window.isWindowFocused

    override val keyboardModifiers: PointerKeyboardModifiers
        get() = window.keyboardModifiers

    override val containerSize: IntSize
        get() = window.containerSize.let { size: IntSize ->
            IntSize(width = size.width, height = size.height - keyboardHeight)
        }

    override val containerDpSize: DpSize
        get() = with(density) { containerSize.toSize().toDpSize() }
}
