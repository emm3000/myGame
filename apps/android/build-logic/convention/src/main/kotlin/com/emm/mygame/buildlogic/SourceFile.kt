package com.emm.mygame.buildlogic

data class SourceFile(val path: String, val text: String) {

    val isProduction: Boolean get() = "/src/main/" in path && !path.startsWith("build-logic/")

    val isTest: Boolean get() = "/src/test/" in path

    val fileName: String get() = path.substringAfterLast('/')

    val declaredName: String get() = fileName.removeSuffix(".kt")

    val directory: String get() = path.substringBeforeLast('/')

    val lineCount: Int
        get() = text.lines().let { lines -> if (lines.last().isEmpty()) lines.size - 1 else lines.size }
}
