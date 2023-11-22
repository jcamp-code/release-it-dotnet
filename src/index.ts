import { promises as fsp } from 'node:fs'
import { cwd, env } from 'node:process'
import { defu } from 'defu'
import { globby } from 'globby'
import { basename, resolve } from 'pathe'
import { Plugin } from 'release-it'
import { rimraf } from 'rimraf'
import shelljs from 'shelljs'

import 'dotenv/config'

import {
  knownDotNetFiles,
  processExtraFiles,
  type ExtraFile,
} from './extra-files'
import { getXmlVersion } from './utils'

const DEFAULT_NUGET_FEED_URL = 'https://api.nuget.org/v3/index.json'

export interface DotNetPluginContext extends DotNetPluginOptions {
  version?: string
  nugetSourceName: string
  bumpedVersion: string
  isPublished: boolean
  cwd?: string
}
export interface DotNetPluginOptions {
  nugetFeedUrl?: string
  nugetApiKey?: string
  packageId?: string
  csprojFile?: string
  versionFile?: string | false
  build?: boolean
  pack: boolean
  publish: boolean
  buildConfiguration: string
  keepArtifacts: boolean
  extraFiles?: string | string[]
}

function getFeedName(nugetFeedUrl: string) {
  if (nugetFeedUrl === null || nugetFeedUrl === DEFAULT_NUGET_FEED_URL)
    return 'NuGet'
  return nugetFeedUrl.replace('https://', '').replace('/v3/index.json', '')
}

const prompts = {
  publish: {
    type: 'confirm',
    message: (context) => {
      const feed = getFeedName(context.nugetFeedUrl)
      return `Publish v${context.version} of ${context.packageId} to ${feed}?`
    },
  },
  build: {
    type: 'confirm',
    message: () => {
      return `Build latest version?`
    },
  },
}

const defaults: DotNetPluginContext = {
  nugetApiKey: env.NUGET_TOKEN || env.NUGET_API_KEY,
  nugetFeedUrl: DEFAULT_NUGET_FEED_URL,
  pack: false,
  build: false,
  publish: true,
  buildConfiguration: 'Release',
  nugetSourceName: 'ReleaseItSource',
  bumpedVersion: '',
  keepArtifacts: false,
  isPublished: false,
}

class DotNetPlugin extends Plugin {
  context: DotNetPluginContext = {} as DotNetPluginContext

  constructor(...args) {
    super(...args)
    this.registerPrompts(prompts)
  }

  getInitialOptions(options, namespace) {
    return options[namespace]
  }

  init() {
    this.context = defu(this.options, defaults)
    this.context.cwd = cwd()

    // can pack without publish, but not the other way around
    if (this.context.publish) this.context.pack = true

    // set version file to csprojFile unless version is explicity set to false
    if (
      this.context.versionFile === undefined &&
      this.context.csprojFile.endsWith('.csproj')
    )
      this.context.versionFile = this.context.csprojFile

    // check the config and environment
    if (this.context.pack || this.context.publish) {
      const dotnetExecutable = shelljs.which('dotnet')
      if (!dotnetExecutable) throw new Error('dotnet executable not found')
      if (!this.context.csprojFile && !this.context.versionFile)
        throw new Error('versionFile or csprojFile is required')

      if (
        this.context.csprojFile &&
        !this.context.versionFile &&
        this.context.csprojFile.endsWith('.sln')
      )
        throw new Error('versionFile required if csprojFile is a solution file')

      if (this.context.publish) {
        if (!this.context.nugetApiKey)
          throw new Error('nugetApiKey is required if publishing is enabled')
        if (!this.context.nugetFeedUrl)
          throw new Error('nugetFeedUrl is required if publishing is enabled')
      }
    }
  }

  static disablePlugin(options) {
    return options.versionFile ? 'npm' : null
  }

  async getLatestVersion() {
    if (this.context?.versionFile) {
      const file = resolve(cwd(), this.context?.versionFile)
      const latestVersion = getXmlVersion(file)
      if (latestVersion === undefined)
        throw new Error(
          `DotNetPlugin: Could not find version info in ${this.context.versionFile}`,
        )
      return latestVersion
    }
  }

  async bump(version) {
    this.context.bumpedVersion = version
  }

  async beforeRelease() {
    const updates: ExtraFile[] = []
    if (this.context?.versionFile) updates.push(this.context?.versionFile)
    if (typeof this.context.extraFiles === 'string')
      updates.push(this.context.extraFiles)
    if (Array.isArray(this.context.extraFiles))
      updates.push(...this.context.extraFiles)

    if (updates.length > 0) {
      this.log.log('🔧 Processing Version Updates...')
      this.log.verbose(updates)

      await processExtraFiles(
        updates,
        this.context.bumpedVersion,
        false,
        knownDotNetFiles,
      )
    }
  }

  async release() {
    const { publish, pack, build } = this.context

    if (build)
      await this.step({
        task: () => this.dotnetBuild(),
        label: 'Build with dotnet',
        prompt: 'build',
      })

    if (!pack && !publish) return

    try {
      await this.dotnetAddSource()
      await this.dotnetPack()

      if (publish) {
        await this.getPackageId()

        await this.step({
          task: () => this.dotnetPublish(),
          label: 'Publish with dotnet nuget',
          prompt: 'publish',
        })
      }
    } catch (e) {
      await this.dotnetCleanUp()
      throw e
    }
  }

  async afterRelease() {
    const feed = getFeedName(this.context.nugetFeedUrl)

    if (this.context.isPublished)
      this.log.log(`🚀 Published v${this.context.bumpedVersion} to ${feed}`)
    await this.dotnetCleanUp()
  }

  // Internal DotNet / Nuget Utils

  async getPackageId() {
    let packageId = this.context.packageId

    if (!packageId) {
      const { csprojFile } = this.context
      if (csprojFile.endsWith('.sln')) {
        packageId = basename(csprojFile).replace('.sln', '')
      } else {
        const file = resolve(cwd(), csprojFile)
        const csprojFileContents = await fsp.readFile(file, 'utf8')
        const match = csprojFileContents.match(/<PackageId>(.*)<\/PackageId>/)
        const packageIdExists = match && match.length > 1
        packageId = packageIdExists
          ? match[1]
          : basename(csprojFile).replace('.csproj', '')
      }
      this.context.packageId = packageId
    }

    this.config.setContext({
      packageId,
      nugetFeedUrl: this.context.nugetFeedUrl,
    })
  }

  async dotnetAddSource() {
    const { nugetFeedUrl, nugetApiKey, nugetSourceName } = this.context

    const log = await this.exec(`dotnet nuget list source`)

    if (log?.includes(nugetFeedUrl)) return

    const command = [
      'dotnet',
      'nuget',
      'add',
      'source',
      nugetFeedUrl,
      '-n',
      nugetSourceName,
      '-u',
      'ReleaseItUser',
      '-p',
      nugetApiKey,
      '--store-password-in-clear-text',
    ]

    this.log.verbose(`DotNetPlugin: Add Source Command: ${command}`)

    await this.exec(command)
  }

  async dotnetBuild() {
    const { csprojFile, buildConfiguration } = this.context

    this.log.log(`🚧 Building ${csprojFile || ''}...`)

    const command = [
      'dotnet',
      'build',
      `"${csprojFile}"`,
      '--configuration',
      buildConfiguration,
    ]

    this.log.verbose(`DotNetPlugin: Building Command: ${command}`)

    await this.exec(command)
  }

  async dotnetPack() {
    const { csprojFile, buildConfiguration, packageId } = this.context

    this.log.log(`🚧 Packing ${csprojFile || packageId}...`)

    const command = [
      'dotnet',
      'pack',
      `"${csprojFile}"`,
      '--configuration',
      buildConfiguration,
      '--output',
      './artifacts',
      // this should be set in the version files instead
      // `-p:PackageVersion=${bumpedVersion}`,
    ]

    this.log.verbose(`DotNetPlugin: Packing Command: ${command}`)

    await this.exec(command)
  }

  async dotnetPublish() {
    try {
      const { nugetFeedUrl, nugetApiKey, packageId } = this.context

      this.log.log(`🚧 Publishing ${packageId}...`)

      const command = [
        'dotnet',
        'nuget',
        'push',
        // changed to publish all packages
        `./artifacts/**.nupkg`,
        // `./artifacts/${packageId}.${bumpedVersion}.nupkg`,
      ]

      command.push('-s')
      command.push(nugetFeedUrl)

      command.push('-k')
      command.push(nugetApiKey)

      this.log.verbose(`DotNetPlugin: Publish Command: ${command}`)

      await this.exec(command, { external: true, write: true })
      this.context.isPublished = true
    } catch (e) {
      await this.dotnetCleanUp()
      throw e
    }
  }

  async dotnetRemoveSource() {
    const { nugetSourceName } = this.context

    const log = await this.exec(`dotnet nuget list source`)

    if (log?.includes(nugetSourceName))
      await this.exec(`dotnet nuget remove source ${nugetSourceName}`)
  }

  async dotnetCleanUp() {
    await this.dotnetRemoveSource()
    if (!this.context.keepArtifacts) {
      await rimraf('./artifacts')
      this.log.log('🗑️ Cleaned up')
    } else {
      const artifacts = await globby(resolve(cwd(), './artifacts/*'))
      this.log.log('📦️ Artifacts Generated')
      this.log.verbose(
        artifacts.filter((artifact) =>
          artifact.includes(this.context.bumpedVersion),
        ),
      )
    }
  }
}
export default DotNetPlugin
