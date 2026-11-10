plugins {
    id("mygame.jvm.library")
}

val domainSources: Directory = rootProject.layout.projectDirectory.dir("../../packages/domain/src")

val sharedCases: Map<String, RegularFile> = mapOf(
    "projection.cases" to domainSources.file("town/projection-cases.json"),
)

dependencies {
    testImplementation(libs.kotlinx.serialization.json)
}

tasks.withType<Test>().configureEach {
    sharedCases.forEach { (property: String, cases: RegularFile) ->
        inputs.file(cases)
        systemProperty(property, cases.asFile.absolutePath)
    }
}
