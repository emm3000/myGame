package com.emm.mygame.buildlogic

data class StructureViolation(val check: String, val path: String, val detail: String) {

    val baselineLine: String get() = "$check $path"
}
