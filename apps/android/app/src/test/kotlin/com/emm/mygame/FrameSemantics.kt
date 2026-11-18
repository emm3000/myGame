package com.emm.mygame

import android.accessibilityservice.AccessibilityServiceInfo
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import androidx.activity.ComponentActivity
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.onRoot
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.ext.junit.rules.ActivityScenarioRule
import org.robolectric.Shadows.shadowOf

private const val TRAVERSAL_BEFORE: String = "android.view.accessibility.extra.EXTRA_DATA_TEST_TRAVERSALBEFORE_VAL"

private const val NO_NODE: Int = -1

private const val KEYBOARD_HEIGHT: Int = 800

internal typealias ActivityComposeRule =
    AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity>

internal fun ActivityComposeRule.keyboard(isOpen: Boolean) {
    val compose: View = checkNotNull(composeViewIn(activity.window.decorView))
    val insets: WindowInsetsCompat = WindowInsetsCompat.Builder()
        .setInsets(WindowInsetsCompat.Type.ime(), Insets.of(0, 0, 0, if (isOpen) KEYBOARD_HEIGHT else 0))
        .setVisible(WindowInsetsCompat.Type.ime(), isOpen)
        .build()
    runOnUiThread { ViewCompat.dispatchApplyWindowInsets(compose, insets) }
    waitForIdle()
}

internal fun ActivityComposeRule.systemBars(height: Int) {
    val compose: View = checkNotNull(composeViewIn(activity.window.decorView))
    val insets: WindowInsetsCompat = WindowInsetsCompat.Builder()
        .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.of(0, 0, 0, height))
        .setInsets(WindowInsetsCompat.Type.statusBars(), Insets.of(0, height, 0, 0))
        .build()
    runOnUiThread { ViewCompat.dispatchApplyWindowInsets(compose, insets) }
    waitForIdle()
}

internal fun ActivityComposeRule.sideBars(navigationBar: Int, cutout: Int) {
    val compose: View = checkNotNull(composeViewIn(activity.window.decorView))
    val insets: WindowInsetsCompat = WindowInsetsCompat.Builder()
        .setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.of(navigationBar, 0, 0, 0))
        .setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.of(0, 0, cutout, 0))
        .build()
    runOnUiThread { ViewCompat.dispatchApplyWindowInsets(compose, insets) }
    waitForIdle()
}

internal fun ActivityComposeRule.traversalOrder(): List<String> {
    val nodes: Map<Int, AccessibilityNodeInfo> = accessibilityNodes()
    return traversalIds().mapNotNull { id: Int -> nodes[id]?.let(::labelOf) }
}

internal fun ActivityComposeRule.traversalIds(): List<Int> {
    val nodes: Map<Int, AccessibilityNodeInfo> = accessibilityNodes()
    val next: Map<Int, Int> = nodes.mapNotNull { (id: Int, node: AccessibilityNodeInfo) ->
        node.extras.getInt(TRAVERSAL_BEFORE, NO_NODE).takeIf { before: Int -> before != NO_NODE }?.let { id to it }
    }.toMap()
    val first: Int = next.keys.first { id: Int -> id !in next.values }
    return generateSequence(first) { id: Int -> next[id] }.toList()
}

private fun ActivityComposeRule.accessibilityNodes(): Map<Int, AccessibilityNodeInfo> {
    val manager: AccessibilityManager = activity.getSystemService(AccessibilityManager::class.java)
    shadowOf(manager).setEnabled(true)
    shadowOf(manager).setTouchExplorationEnabled(true)
    shadowOf(manager).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
    waitForIdle()
    val compose: View = checkNotNull(composeViewIn(activity.window.decorView))
    val provider: AccessibilityNodeProvider = compose.accessibilityNodeProvider
    val nodes: Map<Int, AccessibilityNodeInfo> = semanticsIds().mapNotNull { id: Int ->
        provider.createAccessibilityNodeInfo(id)?.let { node: AccessibilityNodeInfo ->
            provider.addExtraDataToAccessibilityNodeInfo(id, node, TRAVERSAL_BEFORE, null)
            id to node
        }
    }.toMap()
    return nodes
}

private fun labelOf(node: AccessibilityNodeInfo): String? =
    node.text?.toString() ?: node.contentDescription?.toString()

private fun ActivityComposeRule.semanticsIds(): List<Int> {
    val ids: MutableList<Int> = mutableListOf()
    fun walk(node: SemanticsNode) {
        ids += node.id
        node.children.forEach(::walk)
    }
    walk(onRoot(useUnmergedTree = true).fetchSemanticsNode())
    return ids
}

private fun composeViewIn(view: View): View? {
    if (view is ViewRootForTest) return view
    if (view !is ViewGroup) return null
    return (0 until view.childCount).firstNotNullOfOrNull { index: Int -> composeViewIn(view.getChildAt(index)) }
}
