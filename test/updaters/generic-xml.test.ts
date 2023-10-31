import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { describe, expect, it } from 'vitest'

import { GenericXml } from '../../src/extra-files/rp/generic-xml'
import { Version } from '../../src/extra-files/rp/version'

const fixturesPath = './test/updaters/fixtures'

describe('genericXml', () => {
  describe('updateContent', () => {
    it('updates matching entry', async () => {
      const oldContent = readFileSync(
        resolve(cwd(), fixturesPath, './Foo.csproj'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericXml(
        '//project/propertygroup/version',
        Version.parse('v2.3.4'),
      )
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('ignores non-matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericXml(
        '//project/nonExistent',
        Version.parse('v2.3.4'),
      )
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toEqual(oldContent)
    })
    it('updates matching attribute', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './Foo.csproj'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericXml('//Project/@Sdk', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
  })
})
