import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { Generic } from '../../src/extra-files/rp/generic'
import { Version } from '../../src/extra-files/rp/version'

const fixturesPath = './test/updaters/fixtures'

describe('generic', () => {
  describe('updateContent', () => {
    it('updates generic version markers', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Version.java'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const pom = new Generic({
        version: Version.parse('v2.3.4'),
      })
      const newContent = pom.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
  })
})
