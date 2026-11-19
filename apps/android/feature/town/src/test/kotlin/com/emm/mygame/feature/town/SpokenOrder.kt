package com.emm.mygame.feature.town

import android.accessibilityservice.AccessibilityServiceInfo
import android.view.View
import android.view.accessibility.AccessibilityManager
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.onRoot
import org.robolectric.Shadows.shadowOf

private const val TRAVERSAL_BEFORE: String = "android.view.accessibility.extra.EXTRA_DATA_TEST_TRAVERSALBEFORE_VAL"

private const val NO_NODE: Int = -1

internal fun ComposeContentTestRule.spokenOrder(view: View): List<String> {
    val manager: AccessibilityManager = view.context.getSystemService(AccessibilityManager::class.java)
    shadowOf(manager).setEnabled(true)
    shadowOf(manager).setTouchExplorationEnabled(true)
    shadowOf(manager).setEnabledAccessibilityServiceList(listOf(AccessibilityServiceInfo()))
    waitForIdle()
    val provider: AccessibilityNodeProvider = view.accessibilityNodeProvider
    val nodes: Map<Int, AccessibilityNodeInfo> = semanticsIds().mapNotNull { id: Int ->
        provider.createAccessibilityNodeInfo(id)?.let { node: AccessibilityNodeInfo ->
            provider.addExtraDataToAccessibilityNodeInfo(id, node, TRAVERSAL_BEFORE, null)
            id to node
        }
    }.toMap()
    val next: Map<Int, Int> = nodes.mapNotNull { (id: Int, node: AccessibilityNodeInfo) ->
        node.extras.getInt(TRAVERSAL_BEFORE, NO_NODE).takeIf { before: Int -> before != NO_NODE }?.let { before: Int -> id to before }
    }.toMap()
    val first: Int = next.keys.first { id: Int -> id !in next.values }
    return generateSequence(first) { id: Int -> next[id] }
        .mapNotNull { id: Int -> nodes[id]?.let(::labelOf) }
        .toList()
}

private fun labelOf(node: AccessibilityNodeInfo): String? =
    node.text?.toString() ?: node.contentDescription?.toString()

private fun ComposeContentTestRule.semanticsIds(): List<Int> {
    val ids: MutableList<Int> = mutableListOf()
    fun walk(node: SemanticsNode) {
        ids += node.id
        node.children.forEach(::walk)
    }
    walk(onRoot(useUnmergedTree = true).fetchSemanticsNode())
    return ids
}
