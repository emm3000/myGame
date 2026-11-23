package com.emm.mygame.buildlogic

import org.junit.Assert.assertEquals
import org.junit.Test

class StructureFindingsTest {

    private val smallLimits: StructureLimits = StructureLimits(
        productionFileLines = 6,
        testFileLines = 8,
        productionFilesPerPackage = 2,
        privateVarsPerFile = 1,
    )

    private val townMain: String = "feature/town/src/main/kotlin/com/emm/mygame/feature/town"

    private fun linesOf(count: Int): String = (1..count).joinToString(separator = "") { "val line$it: Int = $it\n" }

    private fun findingsOf(vararg sources: SourceFile, baseline: List<String> = emptyList()): List<String> =
        structureFindingsOf(sources.toList(), baseline, smallLimits)

    @Test
    fun `flags a production file over the line limit`() {
        val longFile = SourceFile("$townMain/Line1.kt", linesOf(7))

        assertEquals(
            listOf("file-lines $townMain/Line1.kt: 7 lines, over 6"),
            findingsOf(longFile),
        )
    }

    @Test
    fun `flags a test file over the test line limit`() {
        val longTest = SourceFile("feature/town/src/test/kotlin/Line1Test.kt", linesOf(9))

        assertEquals(
            listOf("test-lines feature/town/src/test/kotlin/Line1Test.kt: 9 lines, over 8"),
            findingsOf(longTest),
        )
    }

    @Test
    fun `passes a violation the baseline holds`() {
        val longFile = SourceFile("$townMain/Line1.kt", linesOf(7))

        assertEquals(emptyList<String>(), findingsOf(longFile, baseline = listOf("file-lines $townMain/Line1.kt")))
    }

    @Test
    fun `flags a baseline line that no longer violates`() {
        val shortFile = SourceFile("$townMain/Line1.kt", linesOf(6))

        assertEquals(
            listOf("file-lines $townMain/Line1.kt: in the baseline but no longer a violation; delete the line"),
            findingsOf(shortFile, baseline = listOf("file-lines $townMain/Line1.kt")),
        )
    }

    @Test
    fun `flags a second copy of a violation the baseline holds once`() {
        val navigation = SourceFile(
            "app/src/main/kotlin/AppNavigation.kt",
            "import com.emm.mygame.feature.town.TownUiState\nimport com.emm.mygame.feature.town.TownViewModel\n" +
                "fun appNavigation() {}\n",
        )

        assertEquals(
            listOf("app-feature-state app/src/main/kotlin/AppNavigation.kt: import com.emm.mygame.feature.town.TownViewModel"),
            findingsOf(navigation, baseline = listOf("app-feature-state app/src/main/kotlin/AppNavigation.kt")),
        )
    }

    @Test
    fun `flags a third baseline copy of a violation that occurs twice`() {
        val navigation = SourceFile(
            "app/src/main/kotlin/AppNavigation.kt",
            "import com.emm.mygame.feature.town.TownUiState\nimport com.emm.mygame.feature.town.TownViewModel\n" +
                "fun appNavigation() {}\n",
        )
        val threeCopies: List<String> = List(3) { "app-feature-state app/src/main/kotlin/AppNavigation.kt" }

        assertEquals(
            listOf(
                "app-feature-state app/src/main/kotlin/AppNavigation.kt: " +
                    "in the baseline but no longer a violation; delete the line",
            ),
            findingsOf(navigation, baseline = threeCopies),
        )
    }

    @Test
    fun `leaves build-logic out of the production files`() {
        val conventionFile = SourceFile("build-logic/convention/src/main/kotlin/KotlinJvm.kt", linesOf(7))

        assertEquals(emptyList<String>(), findingsOf(conventionFile))
    }

    @Test
    fun `flags a package over the file limit without counting its previews`() {
        val crowdedPackage: List<SourceFile> = listOf("Gate", "Well", "Mill").map { SourceFile("$townMain/$it.kt", "class $it\n") }
        val preview = SourceFile("$townMain/GatePreview.kt", "private fun gatePreview() {}\n")

        assertEquals(
            listOf("package-files $townMain: 3 production files, over 2"),
            findingsOf(*crowdedPackage.toTypedArray(), preview),
        )
    }

    @Test
    fun `passes a package at the file limit once its previews are left out`() {
        val fullPackage: List<SourceFile> = listOf("Gate", "Well").map { SourceFile("$townMain/$it.kt", "class $it\n") }
        val preview = SourceFile("$townMain/GatePreview.kt", "private fun gatePreview() {}\n")

        assertEquals(emptyList<String>(), findingsOf(*fullPackage.toTypedArray(), preview))
    }

    @Test
    fun `flags a class over the private var limit`() {
        val restlessViewModel = SourceFile(
            "$townMain/TownViewModel.kt",
            "class TownViewModel {\n    private var first: Int = 0\n    private var second: Int = 0\n}\n",
        )

        assertEquals(
            listOf("private-vars $townMain/TownViewModel.kt: 2 private vars, over 1"),
            findingsOf(restlessViewModel),
        )
    }

    @Test
    fun `flags each line of app that imports a feature's state`() {
        val navigation = SourceFile(
            "app/src/main/kotlin/com/emm/mygame/AppNavigation.kt",
            "import com.emm.mygame.feature.town.TownRoute\nimport com.emm.mygame.feature.town.TownUiState\n" +
                "fun appNavigation() {}\n",
        )

        assertEquals(
            listOf(
                "app-feature-state app/src/main/kotlin/com/emm/mygame/AppNavigation.kt: " +
                    "import com.emm.mygame.feature.town.TownUiState",
            ),
            findingsOf(navigation),
        )
    }

    @Test
    fun `flags every file that writes the projection's gap after the first`() {
        val repository = SourceFile("core/network/src/main/kotlin/HeldTown.kt", "class HeldTown { fun serverNow() {} }\n")
        val viewModel = SourceFile("$townMain/TownViewModel.kt", "class TownViewModel { val gap = readAt - clock.now() }\n")

        assertEquals(
            listOf(
                "projection-gap $townMain/TownViewModel.kt: " +
                    "writes the projection's gap, which core/network/src/main/kotlin/HeldTown.kt already writes",
            ),
            findingsOf(viewModel, repository),
        )
    }

    @Test
    fun `flags two production files that share a name`() {
        val schoolPieces = SourceFile("feature/school/src/main/kotlin/FramePieces.kt", "val framePieces: Int = 1\n")
        val reviewPieces = SourceFile("feature/review/src/main/kotlin/FramePieces.kt", "val framePieces: Int = 2\n")

        assertEquals(
            listOf(
                "duplicate-name feature/review/src/main/kotlin/FramePieces.kt: FramePieces.kt is also " +
                    "feature/school/src/main/kotlin/FramePieces.kt",
                "duplicate-name feature/school/src/main/kotlin/FramePieces.kt: FramePieces.kt is also " +
                    "feature/review/src/main/kotlin/FramePieces.kt",
            ),
            findingsOf(schoolPieces, reviewPieces),
        )
    }

    @Test
    fun `passes a production file and a test file that share a name`() {
        val production = SourceFile("feature/school/src/main/kotlin/Lookup.kt", "val lookup: Int = 1\n")
        val test = SourceFile("feature/school/src/test/kotlin/Lookup.kt", "val lookup: Int = 2\n")

        assertEquals(emptyList<String>(), findingsOf(production, test))
    }

    @Test
    fun `flags a screen file that declares no composable of its name`() {
        val shownScreen = SourceFile("$townMain/TownStatusScreen.kt", "sealed interface TownStatusScreen\n")

        assertEquals(
            listOf("screen-file $townMain/TownStatusScreen.kt: declares no fun TownStatusScreen("),
            findingsOf(shownScreen),
        )
    }

    @Test
    fun `flags a file that declares nothing of its name and carries no suffix`() {
        val labels = SourceFile("$townMain/TownLabels.kt", "fun seasonLabelOf(): Int = 1\n")

        assertEquals(
            listOf("file-name $townMain/TownLabels.kt: declares nothing named TownLabels and carries no suffix of ADR 056, section 5"),
            findingsOf(labels),
        )
    }

    @Test
    fun `passes a top-level function that names its file with a lowercase first letter`() {
        val scaffold = SourceFile("$townMain/PhoneScaffoldOf.kt", "fun <T> Modifier.phoneScaffoldOf(width: T): Int = 1\n")

        assertEquals(emptyList<String>(), findingsOf(scaffold))
    }

    @Test
    fun `passes a file that carries a suffix of the file-name grammar`() {
        val mapping = SourceFile("$townMain/TownMapping.kt", "fun TownDto.toTown(): Town = Town()\n")

        assertEquals(emptyList<String>(), findingsOf(mapping))
    }
}
