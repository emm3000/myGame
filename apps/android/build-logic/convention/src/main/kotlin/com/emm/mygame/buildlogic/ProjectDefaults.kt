package com.emm.mygame.buildlogic

import org.gradle.api.JavaVersion
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

internal const val COMPILE_SDK: Int = 37

internal const val MIN_SDK: Int = 26

internal const val TARGET_SDK: Int = 37

internal val JAVA_VERSION: JavaVersion = JavaVersion.VERSION_17

internal val JVM_TARGET: JvmTarget = JvmTarget.JVM_17

internal const val NAMESPACE_PREFIX: String = "com.emm.mygame"
