plugins {
    id("mygame.jvm.library")
}

val projectionCases: RegularFile = rootProject.layout.projectDirectory
    .file("../../packages/domain/src/resources/projection-cases.json")

dependencies {
    testImplementation(libs.kotlinx.serialization.json)
}

tasks.withType<Test>().configureEach {
    inputs.file(projectionCases)
    systemProperty("projection.cases", projectionCases.asFile.absolutePath)
}
