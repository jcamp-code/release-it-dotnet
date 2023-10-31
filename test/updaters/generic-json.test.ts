import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { GenericJson } from '../../src/extra-files/rp/generic-json'
import { Version } from '../../src/extra-files/rp/version'

const fixturesPath = './test/updaters/fixtures'

describe('genericJson', () => {
  describe('updateContent', () => {
    it('updates matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './esy.json'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericJson('$.version', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('updates deep entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './package-lock-v2.json'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericJson(
        '$.packages..version',
        Version.parse('v2.3.4'),
      )
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('ignores non-matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './esy.json'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericJson('$.nonExistent', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toEqual(oldContent)
    })
    it('warns on invalid jsonpath', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './esy.json'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericJson('bad jsonpath', Version.parse('v2.3.4'))
      expect(() => {
        updater.updateContent(oldContent)
      }).toThrow()
    })
  })
})
