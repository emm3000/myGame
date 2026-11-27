package com.emm.mygame.core.designsystem.art

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import com.emm.mygame.core.designsystem.R
import com.emm.mygame.core.designsystem.control.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGamePlaceTile(
    art: MyGameArt,
    name: MyGameLabel,
    level: MyGameLabel,
    state: MyGameLabel,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier,
    action: @Composable ColumnScope.() -> Unit = {},
) {
    val colors: MyGameColors = MyGameTheme.colors
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    val shape: Shape = RoundedCornerShape(MyGameRadii.lg)
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .border(
                width = if (isFocused) MyGameStrokeWidths.focus else MyGameStrokeWidths.hairline,
                color = if (isFocused) colors.focus else colors.lineStrong,
                shape = shape,
            )
            .clip(shape)
            .clickable(
                interactionSource = interactions,
                indication = LocalIndication.current,
                role = Role.Button,
                onClick = onOpen,
            )
            .padding(MyGameSpacing.step3),
    ) {
        MyGamePlaceArt(art = art, risenFrom = null)
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            MyGameText(label = name, style = MyGameTypography.title, color = colors.ink)
            MyGameText(label = level, style = MyGameTypography.body, color = colors.ink)
            MyGameText(label = state, style = MyGameTypography.caption, color = colors.inkMuted)
        }
        action()
    }
}

private fun previewLabel(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

@PreviewMyGame
@Composable
private fun MyGamePlaceTilePreview() {
    MyGamePreviewSurface {
        Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = Modifier.fillMaxWidth()) {
            MyGamePlaceTile(
                art = MyGameArt(drawable = R.drawable.designsystem_place_farm_1, tint = MyGameArtTint.None),
                name = previewLabel("Farm"),
                level = previewLabel("Level 1"),
                state = previewLabel("You can build level 2."),
                onOpen = {},
                modifier = Modifier.width(MyGameSizes.placeCard),
            ) {
                MyGameGoOutlinedButton(
                    label = "Build for 150 money",
                    isBusy = false,
                    busyDescription = "Sending",
                    onClick = {},
                )
            }
            MyGamePlaceTile(
                art = MyGameArt(drawable = R.drawable.designsystem_place_factory_0, tint = MyGameArtTint.SurfaceSunken),
                name = previewLabel("Factory"),
                level = previewLabel("Not built"),
                state = previewLabel("People needed: 3. Free: 0."),
                onOpen = {},
                modifier = Modifier.width(MyGameSizes.placeCard),
            )
        }
    }
}
