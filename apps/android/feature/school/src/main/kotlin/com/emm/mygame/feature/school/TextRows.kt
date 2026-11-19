package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.ui.chromeResource

@Composable
internal fun TextRows(
    content: SchoolUiState.Content,
    onTextOpen: (TextId) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (content.texts.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameSectionTitle(label = chromeResource(R.string.school_texts))
        content.texts.forEach { card: SchoolUiState.TextCard ->
            MyGameNavRow(
                title = MyGameLabel(text = card.title, translation = null),
                onClick = { onTextOpen(card.text) },
            )
        }
    }
}
