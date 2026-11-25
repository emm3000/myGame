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
include(":core:model")
include(":core:network")
include(":core:projection")
include(":core:designsystem")
include(":core:ui")
include(":core:testing")
include(":core:uitesting")
include(":feature:account")
include(":feature:holdout")
include(":feature:jobs")
include(":feature:learning")
include(":feature:placement")
include(":feature:report")
include(":feature:school")
include(":feature:town")
