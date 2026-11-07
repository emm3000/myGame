package com.emm.mygame.core.ui

data class SchoolPathSteps(val studied: Step, val read: Step, val reviewed: Step, val learned: Step) {

    data class Step(val label: String, val count: String)
}
