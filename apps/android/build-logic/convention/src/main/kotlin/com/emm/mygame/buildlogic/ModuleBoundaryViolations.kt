package com.emm.mygame.buildlogic

const val TEST_FIXTURES: String = "(test-fixtures)"

fun moduleBoundaryViolationsOf(
    edgesByModule: Map<String, List<String>>,
    boundaries: ModuleBoundaries,
    jvmOnlyModulesWithAndroidPlugin: List<String>,
): List<String> = buildList {
    edgesByModule.forEach { (module, edges) ->
        val allowed: Set<String>? = boundaries.allowedEdgesOf(module)
        if (allowed == null) {
            add("$module is not in the Modules table of .claude/rules/android-architecture.md")
        }
        edges.map { it.split('=', limit = 2) }.forEach { (configuration, target) ->
            edgeViolation(module, configuration, target, allowed.orEmpty())?.let(::add)
        }
    }
    jvmOnlyModulesWithAndroidPlugin.forEach { module ->
        add("$module applies an Android plugin; it must stay JVM-only")
    }
}

private fun ModuleBoundaries.allowedEdgesOf(module: String): Set<String>? = when {
    module == ":app" -> emptySet()
    module.startsWith(":feature:") -> featureEdges
    else -> coreEdges[module]
}

private fun edgeViolation(module: String, configuration: String, target: String, allowed: Set<String>): String? {
    val isTestConfiguration: Boolean = configuration.startsWith("test") || configuration.startsWith("androidTest")
    val path: String = target.substringBefore('(')
    val capability: String = target.removePrefix(path)
    return when {
        capability.isNotEmpty() && capability != TEST_FIXTURES ->
            "$module depends on $target through $configuration; no capability but test fixtures is allowed"
        capability == TEST_FIXTURES && !isTestConfiguration ->
            "$module depends on $path's test fixtures through $configuration; only a test configuration may"
        path == ":core:testing" && !isTestConfiguration ->
            "$module depends on :core:testing through $configuration; only a test configuration may"
        path == ":core:testing" -> null
        module == ":app" && (path.startsWith(":feature:") || path.startsWith(":core:")) -> null
        path in allowed -> null
        else -> "$module depends on $target through $configuration; the Modules table does not allow that edge"
    }
}
