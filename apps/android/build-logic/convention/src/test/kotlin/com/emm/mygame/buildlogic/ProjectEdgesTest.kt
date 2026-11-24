package com.emm.mygame.buildlogic

import org.gradle.api.Project
import org.gradle.api.artifacts.Dependency
import org.gradle.api.artifacts.ModuleDependency
import org.gradle.api.artifacts.dsl.DependencyHandler
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.assertEquals
import org.junit.Test

class ProjectEdgesTest {

    private val root: Project = ProjectBuilder.builder().withName("myGame").build()

    private val core: Project = ProjectBuilder.builder().withName("core").withParent(root).build()

    private val feature: Project = ProjectBuilder.builder().withName("feature").withParent(root).build()

    private val town: Project = ProjectBuilder.builder().withName("town").withParent(feature).build()

    init {
        ProjectBuilder.builder().withName("ui").withParent(core).build()
        town.configurations.create("testImplementation")
    }

    private fun edgesWith(dependency: DependencyHandler.() -> Dependency): List<String> {
        town.dependencies.add("testImplementation", town.dependencies.dependency())
        return town.projectEdges()
    }

    private fun DependencyHandler.coreUi(): Dependency = project(mapOf("path" to ":core:ui"))

    @Test
    fun `records a test fixtures edge with its capability`() {
        assertEquals(listOf("testImplementation=:core:ui(test-fixtures)"), edgesWith { testFixtures(coreUi()) })
    }

    @Test
    fun `records an edge to another capability by its name`() {
        val edges: List<String> = edgesWith {
            (coreUi() as ModuleDependency).capabilities { requireCapability("myGame.core:other") }
        }

        assertEquals(listOf("testImplementation=:core:ui(other)"), edges)
    }
}
