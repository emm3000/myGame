package com.emm.mygame.core.designsystem

private const val NARROW_NO_BREAK_SPACE: Char = '\u202F'
private const val DIGITS_PER_GROUP: Int = 3

fun formatQuantity(quantity: Long): String =
    quantity.toString().reversed().chunked(DIGITS_PER_GROUP).joinToString(NARROW_NO_BREAK_SPACE.toString()).reversed()
