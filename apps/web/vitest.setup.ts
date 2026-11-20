import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const isStylesheetLink = (node: Node): node is HTMLLinkElement =>
  node instanceof HTMLLinkElement &&
  (node.rel === 'stylesheet' || node.getAttribute('as') === 'style')

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (isStylesheetLink(node)) {
        queueMicrotask(() => node.dispatchEvent(new Event('load')))
      }
    }
  }
}).observe(document, { childList: true, subtree: true })

afterEach(cleanup)
