import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { GenericYaml } from '../../src/extra-files/rp/generic-yaml'
import { Version } from '../../src/extra-files/rp/version'

const fixturesPath = './test/updaters/fixtures'

describe('genericYaml', () => {
  describe('updateContent', () => {
    it('updates matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml('$.version', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('updates deep entry in json', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './package-lock-v2.json'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml(
        '$.packages..version',
        Version.parse('v2.3.4'),
      )
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('updates deep entry in yaml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml(
        '$.dependencies..version',
        Version.parse('v2.3.4'),
      )
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
    it('ignores non-matching entry', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml('$.nonExistent', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toEqual(oldContent)
    })
    it('warns on invalid jsonpath', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './helm/Chart.yaml'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml('bad jsonpath', Version.parse('v2.3.4'))
      expect(() => {
        updater.updateContent(oldContent)
      }).toThrow()
    })
    it('ignores invalid file', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './yaml/invalid.txt'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml('$.boo', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toEqual(oldContent)
    })
    it('updates multi-document yaml', async () => {
      const oldContent = readFileSync(
        resolve(fixturesPath, './yaml/multi.yaml'),
        'utf8',
      ).replace(/\r\n/g, '\n')
      const updater = new GenericYaml('$.version', Version.parse('v2.3.4'))
      const newContent = updater.updateContent(oldContent)
      expect(newContent).toMatchSnapshot()
    })
  })
})
