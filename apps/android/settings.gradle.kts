pluginManagement {
    includeBuild("build-logic")
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "myGame"
include(":app")
include(":core:network")
include(":core:projection")
include(":core:designsystem")
include(":core:ui")
include(":core:testing")
include(":feature:chronicle")
include(":feature:fief")
include(":feature:map")
include(":feature:signin")
