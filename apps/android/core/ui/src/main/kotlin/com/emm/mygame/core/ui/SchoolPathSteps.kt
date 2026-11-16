package com.emm.mygame.core.ui

import com.emm.mygame.core.designsystem.MyGameLabel

data class SchoolPathSteps(val studied: Step, val read: Step, val reviewed: Step, val learned: Step) {

    data class Step(val label: MyGameLabel, val count: MyGameLabel)
}
