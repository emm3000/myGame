package com.emm.mygame.core.network

import com.emm.mygame.core.testing.FakeStudyAnswerSink

fun discardedStudyAnswers(store: TokenStore): StudyAnswers = StudyAnswers(store, FakeStudyAnswerSink())
