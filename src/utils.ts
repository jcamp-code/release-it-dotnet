import { existsSync, promises as fsp, readFileSync } from 'node:fs'
import * as dom from '@xmldom/xmldom'
import * as xpath from 'xpath'

export const readJSON = (file) => JSON.parse(readFileSync(file, 'utf8'))

export async function getXmlVersion(path: string) {
  if (path)
    if (existsSync(path)) {
      const content = await fsp.readFile(path, 'utf-8')
      const document = new dom.DOMParser().parseFromString(content)
      const nodes = xpath.select(
        '//Project/PropertyGroup/Version',
        document,
      ) as Node[]
      if (nodes && nodes[0]) return nodes[0].textContent
    }
}
