package com.emm.mygame.buildlogic

import org.junit.Assert.assertEquals
import org.junit.Test

class KoinFindingsTest {

    private val appMain: String = "app/src/main/kotlin/com/emm/mygame"

    private val newsMain: String = "feature/report/src/main/kotlin/com/emm/mygame/feature/report/news"

    private fun findingsOf(vararg sources: SourceFile): List<String> =
        structureFindingsOf(sources.toList(), clientStructureLimits)

    @Test
    fun `flags a core file that names Koin, its tests included`() {
        val heldTownTest = SourceFile(
            "core/model/src/test/kotlin/com/emm/mygame/core/model/town/HeldTownTest.kt",
            "import org.koin.test.KoinTest\nclass HeldTownTest\n",
        )

        assertEquals(
            listOf(
                "koin-in-core core/model/src/test/kotlin/com/emm/mygame/core/model/town/HeldTownTest.kt: " +
                    "names Koin, which no core module may",
            ),
            findingsOf(heldTownTest),
        )
    }

    @Test
    fun `flags a ViewModel that names Koin`() {
        val viewModel = SourceFile(
            "$newsMain/NewsViewModel.kt",
            "import org.koin.core.annotation.KoinViewModel\nclass NewsViewModel\n",
        )

        assertEquals(
            listOf(
                "koin-in-state $newsMain/NewsViewModel.kt: names Koin, which a ViewModel, a state, a screen and a mapping may not",
                "koin-outside-wiring $newsMain/NewsViewModel.kt: names Koin outside the files ADR 058, section 5 lets name it",
            ),
            findingsOf(viewModel),
        )
    }

    @Test
    fun `flags a file outside the wiring that imports Koin`() {
        val copy = SourceFile("$newsMain/NewsCopy.kt", "import org.koin.compose.KoinContext\nval newsCopy: Int = 1\n")

        assertEquals(
            listOf("koin-outside-wiring $newsMain/NewsCopy.kt: names Koin outside the files ADR 058, section 5 lets name it"),
            findingsOf(copy),
        )
    }

    @Test
    fun `flags bindings declared outside a bindings file`() {
        val entries = SourceFile(
            "$appMain/navigation/NewsEntries.kt",
            "import org.koin.dsl.module\nval newsEntries: Int = 1\n",
        )

        assertEquals(
            listOf("bindings-outside-bindings $appMain/navigation/NewsEntries.kt: declares bindings outside a *Bindings.kt"),
            findingsOf(entries),
        )
    }

    @Test
    fun `flags a ViewModel opened from the graph outside a route`() {
        val copy = SourceFile("$appMain/navigation/NewsCopy.kt", "val newsCopy: Int = koinViewModel()\n")

        assertEquals(
            listOf("view-model-opener $appMain/navigation/NewsCopy.kt: opens a ViewModel from the graph outside a route"),
            findingsOf(copy),
        )
    }

    @Test
    fun `flags each line outside app's navigation that pulls from the graph by hand`() {
        val route = SourceFile(
            "$newsMain/NewsRoute.kt",
            "fun NewsRoute() {\n    val clock: Clock = koinInject()\n}\n",
        )

        assertEquals(
            listOf("hand-pull $newsMain/NewsRoute.kt: line 2, val clock: Clock = koinInject()"),
            findingsOf(route),
        )
    }

    @Test
    fun `flags a file that names the graph outside the classes the manifest starts`() {
        val entries = SourceFile(
            "$appMain/navigation/NewsEntries.kt",
            "fun newsEntry(graph: AppGraph) {}\nval newsEntries: Int = 1\n",
        )

        assertEquals(
            listOf(
                "graph-name $appMain/navigation/NewsEntries.kt: " +
                    "names the graph outside AppGraph and the classes the manifest starts",
            ),
            findingsOf(entries),
        )
    }

    @Test
    fun `flags each line of a test that starts a global Koin`() {
        val test = SourceFile(
            "app/src/test/kotlin/com/emm/mygame/NewsGraphTest.kt",
            "class NewsGraphTest {\n    val graph = startKoin { }\n}\n",
        )

        assertEquals(
            listOf("global-koin app/src/test/kotlin/com/emm/mygame/NewsGraphTest.kt: line 2, val graph = startKoin { }"),
            findingsOf(test),
        )
    }

    @Test
    fun `flags each binding with a type argument`() {
        val bindings = SourceFile(
            "$appMain/AppBindings.kt",
            "val appBindings: Module\n    get() = module {\n        single<StateFlow<PlayerLanguage?>> { get() }\n    }\n",
        )

        assertEquals(
            listOf("typed-binding $appMain/AppBindings.kt: line 3, single<StateFlow<PlayerLanguage?>> { get() }"),
            findingsOf(bindings),
        )
    }

    @Test
    fun `flags a bindings value that stores its Module`() {
        val bindings = SourceFile("$appMain/AppBindings.kt", "val appBindings: Module = module { }\n")

        assertEquals(
            listOf("stored-bindings $appMain/AppBindings.kt: line 1, val appBindings: Module = module { }"),
            findingsOf(bindings),
        )
    }

    @Test
    fun `flags a bindings value that stores its Module lazily`() {
        val bindings = SourceFile(
            "$appMain/AppBindings.kt",
            "val appBindings: Module by lazy {\n    module { }\n}\n",
        )

        assertEquals(
            listOf("stored-bindings $appMain/AppBindings.kt: line 1, val appBindings: Module by lazy {"),
            findingsOf(bindings),
        )
    }

    @Test
    fun `flags a bindings getter that reads a stored Module`() {
        val bindings = SourceFile(
            "$appMain/AppBindings.kt",
            "private val cached: Module = module { }\n\nval appBindings: Module\n    get() = cached\n",
        )

        assertEquals(
            listOf("stored-bindings $appMain/AppBindings.kt: line 1, private val cached: Module = module { }"),
            findingsOf(bindings),
        )
    }

    @Test
    fun `passes the wiring that ADR 058 lets name Koin`() {
        val wiring: List<SourceFile> = listOf(
            SourceFile(
                "$newsMain/NewsRoute.kt",
                "import org.koin.compose.viewmodel.koinViewModel\nfun NewsRoute(viewModel: NewsViewModel = koinViewModel()) {}\n",
            ),
            SourceFile(
                "feature/report/src/main/kotlin/com/emm/mygame/feature/report/ReportBindings.kt",
                "import org.koin.core.module.Module\nimport org.koin.dsl.module\n" +
                    "val reportBindings: Module\n    get() = module { viewModelOf(::NewsViewModel) }\n",
            ),
            SourceFile(
                "$appMain/MainActivity.kt",
                "import org.koin.compose.KoinIsolatedContext\nclass MainActivity { val graph: AppGraph }\n",
            ),
            SourceFile(
                "$appMain/navigation/AppNavigation.kt",
                "import org.koin.compose.koinInject\nfun AppNavigation(ends: SessionEnds = koinInject()) {}\n",
            ),
            SourceFile(
                "app/src/test/kotlin/com/emm/mygame/FakePortBindings.kt",
                "import org.koin.dsl.module\nfun fakePortBindings(): Module = module { single<Clock> { clock } }\n",
            ),
        )

        assertEquals(emptyList<String>(), findingsOf(*wiring.toTypedArray()))
    }
}
