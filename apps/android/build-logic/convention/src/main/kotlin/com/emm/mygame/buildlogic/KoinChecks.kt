package com.emm.mygame.buildlogic

private val stateFileSuffixes: List<String> = listOf("ViewModel.kt", "UiState.kt", "Screen.kt", "UiStateMapping.kt")

private val manifestStartedFiles: List<String> =
    listOf("MyGameApplication.kt", "MainActivity.kt", "StudyReminderReceiver.kt")

private val viewModelOpenerFiles: List<String> = listOf("RetainedWordsRing.kt", "AppNavigation.kt", "SignedInFrame.kt")

private val koinWiringFiles: List<String> = listOf("RetainedWordsRing.kt", "AppGraph.kt") + manifestStartedFiles

private val storedModule: Regex =
    Regex("""val \w+Bindings(: Module)? = |\bval\s+\w+(\s*:\s*Module)?\s*(=|by\s+lazy\s*\{)\s*module\b""")

private sealed interface Reported {

    data class EachFile(val detail: String) : Reported

    data object EachLine : Reported
}

private data class KoinRule(
    val check: String,
    val pattern: Regex,
    val reported: Reported,
    val covers: (SourceFile) -> Boolean,
)

private val koinRules: List<KoinRule> = listOf(
    KoinRule(
        "koin-in-core",
        Regex("""org\.koin"""),
        Reported.EachFile("names Koin, which no core module may"),
    ) { it.path.startsWith("core/") },
    KoinRule(
        "koin-in-state",
        Regex("""org\.koin"""),
        Reported.EachFile("names Koin, which a ViewModel, a state, a screen and a mapping may not"),
    ) { file -> !file.isUnderTest && stateFileSuffixes.any(file.fileName::endsWith) },
    KoinRule(
        "koin-outside-wiring",
        Regex("""org\.koin"""),
        Reported.EachFile("names Koin outside the files ADR 058, section 5 lets name it"),
    ) { file -> file.isClientSource && !file.isKoinWiring },
    KoinRule(
        "bindings-outside-bindings",
        Regex("""org\.koin\.dsl\.module|org\.koin\.core\.module\."""),
        Reported.EachFile("declares bindings outside a *Bindings.kt"),
    ) { file -> file.isClientSource && !file.isBindings },
    KoinRule(
        "view-model-opener",
        Regex("""koinViewModel"""),
        Reported.EachFile("opens a ViewModel from the graph outside a route"),
    ) { file -> file.isClientSource && !file.isRoute && file.fileName !in viewModelOpenerFiles },
    KoinRule("hand-pull", Regex("""koinInject|getKoin"""), Reported.EachLine) { file ->
        file.isClientSource && !file.isAppNavigation
    },
    KoinRule(
        "graph-name",
        Regex("""\bAppGraph\b|org\.koin\.core\.Koin(Application)?\b"""),
        Reported.EachFile("names the graph outside AppGraph and the classes the manifest starts"),
    ) { file -> file.isClientSource && file.fileName != "AppGraph.kt" && file.fileName !in manifestStartedFiles },
    KoinRule("global-koin", Regex("""KoinComponent|GlobalContext|startKoin"""), Reported.EachLine) {
        !it.isBuildLogic
    },
    KoinRule("typed-binding", Regex("""(single|factory|viewModel)<[^>(]*<"""), Reported.EachLine) {
        it.isBindings
    },
    KoinRule("stored-bindings", storedModule, Reported.EachLine) { it.isBindings },
)

val koinChecks: List<StructureCheck> = koinRules.map { rule -> { sources, _ -> rule.violationsIn(sources) } }

private fun KoinRule.violationsIn(sources: List<SourceFile>): List<StructureViolation> =
    sources.filter(covers).flatMap { file ->
        when (reported) {
            is Reported.EachFile -> fileViolationOf(file, reported.detail)
            Reported.EachLine -> lineViolationsOf(file)
        }
    }

private fun KoinRule.fileViolationOf(file: SourceFile, detail: String): List<StructureViolation> =
    if (pattern.containsMatchIn(file.text)) listOf(StructureViolation(check, file.path, detail)) else emptyList()

private fun KoinRule.lineViolationsOf(file: SourceFile): List<StructureViolation> =
    pattern.findAll(file.text).map { StructureViolation(check, file.path, file.lineAt(it.range.first)) }.toList()

private fun SourceFile.lineAt(index: Int): String {
    val number: Int = text.take(index).count { it == '\n' } + 1
    return "line $number, ${text.lines()[number - 1].trim()}"
}

private val SourceFile.isUnderTest: Boolean get() = "/src/test/" in path

private val SourceFile.isBuildLogic: Boolean get() = path.startsWith("build-logic/")

private val SourceFile.isClientSource: Boolean get() = !isUnderTest && !isBuildLogic

private val SourceFile.isBindings: Boolean get() = fileName.endsWith("Bindings.kt")

private val SourceFile.isRoute: Boolean get() = fileName.endsWith("Route.kt")

private val SourceFile.isAppNavigation: Boolean get() = path.startsWith("app/src/main/") && "/navigation/" in path

private val SourceFile.isKoinWiring: Boolean
    get() = isBindings || isRoute || isAppNavigation || fileName in koinWiringFiles
