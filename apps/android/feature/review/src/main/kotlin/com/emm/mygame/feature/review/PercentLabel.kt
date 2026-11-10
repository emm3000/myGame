package com.emm.mygame.feature.review

import java.math.BigDecimal

internal fun percentLabelOf(percent: Double): String =
    BigDecimal.valueOf(percent).stripTrailingZeros().toPlainString().replace('.', ',')
