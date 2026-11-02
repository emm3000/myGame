package com.emm.mygame.core.designsystem

private const val THIN_SPACE: Char = ' '
private const val DIGITS_PER_GROUP: Int = 3

fun formatQuantity(quantity: Long): String =
    quantity.toString().reversed().chunked(DIGITS_PER_GROUP).joinToString(THIN_SPACE.toString()).reversed()
