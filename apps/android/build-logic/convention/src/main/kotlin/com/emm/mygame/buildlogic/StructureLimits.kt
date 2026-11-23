package com.emm.mygame.buildlogic

data class StructureLimits(
    val productionFileLines: Int,
    val testFileLines: Int,
    val productionFilesPerPackage: Int,
    val privateVarsPerFile: Int,
)

val clientStructureLimits: StructureLimits = StructureLimits(
    productionFileLines = 250,
    testFileLines = 600,
    productionFilesPerPackage = 30,
    privateVarsPerFile = 5,
)
