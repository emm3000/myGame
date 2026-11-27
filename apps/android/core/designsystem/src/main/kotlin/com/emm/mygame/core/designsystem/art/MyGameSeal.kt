package com.emm.mygame.core.designsystem.art

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

private const val GRID: Float = 24f

private val checkPoints: List<Offset> = listOf(Offset(7f, 12.5f), Offset(10.5f, 16f), Offset(17f, 8.5f))

val SEAL: SemanticsPropertyKey<Unit> = SemanticsPropertyKey("SEAL")

private var SemanticsPropertyReceiver.seal: Unit by SEAL

@Composable
fun MyGameSeal(modifier: Modifier = Modifier) {
    val disc: Color = MyGameTheme.colors.onBlock
    Canvas(
        modifier = modifier
            .size(MyGameSizes.icon)
            .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
            .semantics { seal = Unit },
    ) {
        drawCircle(color = disc)
        cutOutCheck()
    }
}

private fun DrawScope.cutOutCheck() {
    val unit: Float = size.width / GRID
    val check: Path = Path()
    checkPoints.forEachIndexed { index: Int, point: Offset ->
        val at: Offset = point * unit
        if (index == 0) check.moveTo(at.x, at.y) else check.lineTo(at.x, at.y)
    }
    drawPath(
        path = check,
        color = Color.Black,
        style = Stroke(width = MyGameStrokeWidths.ICON * unit, cap = StrokeCap.Round, join = StrokeJoin.Round),
        blendMode = BlendMode.Clear,
    )
}

@PreviewMyGame
@Composable
private fun MyGameSealPreview() {
    MyGamePreviewSurface {
        MyGameBlock(hue = MyGameBlockHue.Peach) { MyGameSeal() }
    }
}
