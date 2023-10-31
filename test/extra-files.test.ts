import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  knownDotNetFiles,
  processExtraFiles,
  type ExtraFile,
} from '../src/extra-files'

const fixturesPath = './test/updaters/fixtures'

describe('extra-files', async () => {
  it('updates all files in list', async () => {
    const extraFiles: ExtraFile[] = [
      resolve(fixturesPath, './Version.java'),
      {
        path: resolve(fixturesPath, './helm/Chart.yaml'),
        type: 'yaml',
        jsonpath: '$.version',
      },
      {
        path: resolve(fixturesPath, './Foo.csproj'),
        type: 'xml',
        xpath: '//Project/PropertyGroup/Version',
      },
    ]
    const updates = await processExtraFiles(extraFiles, '3.2.7', true)
    expect(updates[0].newContent).toMatchSnapshot()
    expect(updates[1].newContent).toMatchSnapshot()
    expect(updates[2].newContent).toMatchSnapshot()
  })
  it('updates all known files in list', async () => {
    const extraFiles: ExtraFile[] = [
      resolve(fixturesPath, './Foo.csproj'),
      resolve(fixturesPath, './Directory.Build.props'),
    ]
    const updates = await processExtraFiles(
      extraFiles,
      '3.2.7',
      true,
      knownDotNetFiles,
    )
    expect(updates[0].newContent).toMatchSnapshot()
    expect(updates[1].newContent).toMatchSnapshot()
  })
  it('supports globs of known files', async () => {
    const extraFiles: ExtraFile[] = ['./test/updaters/fixtures/*.csproj']
    const updates = await processExtraFiles(
      extraFiles,
      '3.2.7',
      true,
      knownDotNetFiles,
    )
    expect(updates[0].newContent).toMatchSnapshot()
    expect(updates[1].newContent).toMatchSnapshot()
  })
})
