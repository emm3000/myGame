import org.openapitools.generator.gradle.plugin.tasks.GenerateTask

plugins {
    id("mygame.android.library")
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.openapi.generator)
}

val generateApiClient: TaskProvider<GenerateTask> = tasks.named<GenerateTask>("openApiGenerate") {
    generatorName.set("kotlin")
    library.set("jvm-retrofit2")
    inputSpec.set(rootProject.layout.projectDirectory.file("../api/openapi.json").asFile.path)
    ignoreFileOverride.set(layout.projectDirectory.file("openapi-generator-ignore"))
    cleanupOutput.set(true)
    packageName.set("com.emm.mygame.core.network.generated")
    generateApiTests.set(false)
    generateModelTests.set(false)
    generateApiDocumentation.set(false)
    generateModelDocumentation.set(false)
    typeMappings.set(mapOf("number" to "kotlin.Double"))
    configOptions.set(
        mapOf(
            "serializationLibrary" to "kotlinx_serialization",
            "useCoroutines" to "true",
            "enumUnknownDefaultCase" to "true",
            "generateOneOfAnyOfWrappers" to "true",
            "omitGradleWrapper" to "true",
            "sourceFolder" to "",
        ),
    )
}

androidComponents {
    onVariants { variant ->
        variant.sources.kotlin?.addGeneratedSourceDirectory(generateApiClient, GenerateTask::outputDir)
    }
}

dependencies {
    implementation(libs.okhttp)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.kotlinx.serialization)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.core)

    testImplementation(project(":core:testing"))
    testImplementation(libs.okhttp.mockwebserver)
}
