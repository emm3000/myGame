import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Block } from './Block'

it.each(['peach', 'mint', 'periwinkle', 'lavender'] as const)(
  'draws a flat block on %s with on-block text and no border',
  (hue) => {
    render(
      <Block hue={hue} labelledBy="title">
        <h3 id="title">Next</h3>
      </Block>,
    )

    const classes = screen.getByRole('region', { name: 'Next' }).className.split(' ')

    expect(classes).toEqual(
      expect.arrayContaining(['rounded-lg', 'text-on-block', `bg-block-${hue}`]),
    )
    expect(classes).not.toContain('border')
  },
)
