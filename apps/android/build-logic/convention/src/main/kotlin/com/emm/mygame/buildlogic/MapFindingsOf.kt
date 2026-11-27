package com.emm.mygame.buildlogic

private val includedModule: Regex = Regex("""^include\(":([\w:]+)"\)""", RegexOption.MULTILINE)

private val moduleRow: Regex = Regex("""^\| `((?:app|core|feature)[\w:]*)` \|""", RegexOption.MULTILINE)

fun mapFindingsOf(settings: String, map: String): List<String> {
    val included: Set<String> = includedModule.findAll(settings).map { it.groupValues[1] }.toSortedSet()
    val mapped: Set<String> = moduleRow.findAll(map).map { it.groupValues[1] }.toSortedSet()
    val unmapped: List<String> = (included - mapped).map { module ->
        "map-table $module: included in settings.gradle.kts, absent from the module table of ARCHITECTURE.md"
    }
    val unbuilt: List<String> = (mapped - included).map { module ->
        "map-table $module: a row of the module table of ARCHITECTURE.md, not included in settings.gradle.kts"
    }
    return unmapped + unbuilt
}
