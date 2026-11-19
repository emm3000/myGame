package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val TOP: String = "top"

private const val REVEALED: String = "revealed"

@RunWith(RobolectricTestRunner::class)
class RevealOnceTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Composable
    private fun Page(key: String?) {
        Column(modifier = Modifier.height(400.dp).verticalScroll(rememberScrollState())) {
            Spacer(modifier = Modifier.height(48.dp).testTag(TOP))
            Spacer(modifier = Modifier.height(2000.dp))
            if (key != null) Box(modifier = Modifier.size(48.dp).then(rememberRevealOnce(key)).testTag(REVEALED))
        }
    }

    @Test
    fun `brings a view into view for its first key`() {
        val key: MutableState<String?> = mutableStateOf(null)
        composeRule.setContent { Page(key = key.value) }

        composeRule.runOnIdle { key.value = "first" }

        composeRule.onNodeWithTag(REVEALED).assertIsDisplayed()
    }

    @Test
    fun `brings a view into view once per key, not again after a restore`() {
        val key: MutableState<String?> = mutableStateOf(null)
        val restoration: StateRestorationTester = StateRestorationTester(composeRule)
        restoration.setContent { Page(key = key.value) }
        composeRule.runOnIdle { key.value = "first" }
        composeRule.onNodeWithTag(REVEALED).assertIsDisplayed()
        composeRule.onNodeWithTag(TOP).performScrollTo()

        restoration.emulateSavedInstanceStateRestore()

        composeRule.onNodeWithTag(REVEALED).assertIsNotDisplayed()
    }

    @Test
    fun `brings a view into view again for a new key`() {
        val key: MutableState<String?> = mutableStateOf(null)
        composeRule.setContent { Page(key = key.value) }
        composeRule.runOnIdle { key.value = "first" }
        composeRule.onNodeWithTag(REVEALED).assertIsDisplayed()
        composeRule.onNodeWithTag(TOP).performScrollTo()

        composeRule.runOnIdle { key.value = "second" }

        composeRule.onNodeWithTag(REVEALED).assertIsDisplayed()
    }
}
