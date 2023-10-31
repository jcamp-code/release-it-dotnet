import { existsSync, promises as fsp } from 'node:fs'
import { globby, isDynamicPattern } from 'globby'

import { Generic } from './rp/generic'
import { GenericJson } from './rp/generic-json'
import { GenericXml } from './rp/generic-xml'
import { GenericYaml } from './rp/generic-yaml'
import type { Update, Updater } from './rp/update'
import { Version } from './rp/version'

export * from './knownFileTypes'

export interface ExtraJsonFile {
  type: 'json'
  path: string
  jsonpath: string
}
export interface ExtraYamlFile {
  type: 'yaml'
  path: string
  jsonpath: string
}
export interface ExtraXmlFile {
  type: 'xml'
  path: string
  xpath: string
}
export type ExtraFile = string | ExtraJsonFile | ExtraYamlFile | ExtraXmlFile

async function extraFilePaths(extraFile: ExtraFile): Promise<string[]> {
  const path = typeof extraFile === 'string' ? extraFile : extraFile.path
  if (!isDynamicPattern(path)) return [path]
  return await globby(path)
}

function getUpdate(
  type: string,
  path: string,
  updatePath: string,
  version: Version,
): Update {
  switch (type) {
    case 'json':
      return {
        path,
        createIfMissing: false,
        updater: new GenericJson(updatePath, version),
      }
    case 'yaml':
      return {
        path,
        createIfMissing: false,
        updater: new GenericYaml(updatePath, version),
      }
    case 'xml':
      return {
        path,
        createIfMissing: false,
        updater: new GenericXml(updatePath, version),
      }
    default:
      throw new Error(`unsupported extraFile type: ${type}`)
  }
}

export async function extraFileUpdates(
  extraFiles: ExtraFile[],
  version: Version,
  knownDefaults?: (string) => { type: string; updatePath: string } | undefined,
): Promise<Update[]> {
  const extraFileUpdates: Update[] = []
  for (const extraFile of extraFiles)
    if (typeof extraFile === 'object') {
      const paths = await extraFilePaths(extraFile)
      for (const path of paths)
        switch (extraFile.type) {
          case 'json':
          case 'yaml':
            extraFileUpdates.push(
              getUpdate(extraFile.type, path, extraFile.jsonpath, version),
            )
            break
          case 'xml':
            extraFileUpdates.push(
              getUpdate('xml', path, extraFile.xpath, version),
            )
            break
          default:
            throw new Error(
              `unsupported extraFile type: ${
                (extraFile as { type: string }).type
              }`,
            )
        }
    } else {
      const paths = await extraFilePaths(extraFile)
      for (const path of paths) {
        if (knownDefaults) {
          const { type, updatePath } = knownDefaults(path)
          if (type && updatePath) {
            extraFileUpdates.push(getUpdate(type, path, updatePath, version))
            continue
          }
        }
        extraFileUpdates.push({
          path,
          createIfMissing: false,
          updater: new Generic({ version }),
        })
      }
    }

  return extraFileUpdates
}

export async function processExtraFiles(
  extraFiles: ExtraFile[],
  version: string,
  isDryRun: boolean,
  knownDefaults?: (string) => { type: string; updatePath: string } | undefined,
): Promise<Update[]> {
  const versionObject = Version.parse(version)
  const updates = await extraFileUpdates(
    extraFiles,
    versionObject,
    knownDefaults,
  )
  for (const update of updates)
    if (existsSync(update.path)) {
      const content = await fsp.readFile(update.path, 'utf-8')
      update.newContent = update.updater.updateContent(content)
      if (!isDryRun) await fsp.writeFile(update.path, update.newContent)
    }

  return updates
}
