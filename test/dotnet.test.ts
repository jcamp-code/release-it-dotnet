import { promises as fsp } from 'node:fs'
import { factory, runTasks } from 'release-it/test/util/index.js'
import shelljs from 'shelljs'
import { describe, expect, it } from 'vitest'

import Plugin from '../src'
import { GenericXml } from '../src/extra-files/rp/generic-xml'
import { Version } from '../src/extra-files/rp/version'
import { getXmlVersion } from '../src/utils'

const namespace = 'dotnet-plugin'
describe('dotnet-plugin', async () => {
  it('should not throw if publish off', async () => {
    const options = { [namespace]: { publish: false } }
    const plugin = factory(Plugin, { namespace, options })
    expect(async () => {
      await runTasks(plugin)
      // console.log(result)
    }).not.toThrowError()
  })
  it.fails('should throw if no csprojfile', async () => {
    const options = { [namespace]: {} }
    const plugin = factory(Plugin, { namespace, options })
    await expect(runTasks(plugin)).rejects.toBe(1)
  })
  it('updates CS Proj file', async () => {
    const document = await fsp.readFile('./test/fixtures/test.csproj', 'utf-8')
    const xmlUpdater = new GenericXml(
      '//project/propertygroup/version',
      new Version(3, 0, 7),
    )
    expect(xmlUpdater.updateContent(document)).toMatchSnapshot()
  })
  it('updates Directory Props', async () => {
    const document = await fsp.readFile(
      './test/fixtures/Directory.Build.props',
      'utf-8',
    )
    const xmlUpdater = new GenericXml(
      '//project/propertygroup/version',
      new Version(3, 0, 7),
    )
    expect(xmlUpdater.updateContent(document)).toMatchInlineSnapshot(`
      "<Project>

        <PropertyGroup>
          <RootNamespace>MongoFramework.AspNetCore.Identity</RootNamespace>
          <PackageId>$(AssemblyName)</PackageId>
          <PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>
          <PackageLicenseFile>LICENSE</PackageLicenseFile>
          <PackageProjectUrl>https://github.com/JohnCampionJr/MongoFramework.AspNetCore.Identity</PackageProjectUrl>
          <PackageBaseTags>mongodb;mongoframework;mongo;identity</PackageBaseTags>

          <RepositoryUrl>https://github.com/jcamp-code/release-it</RepositoryUrl>
          <RepositoryType>git</RepositoryType>
          <RepositoryBranch>main</RepositoryBranch>

          <!-- SourceLink Support -->
          <PublishRepositoryUrl>true</PublishRepositoryUrl>
          <EmbedUntrackedSources>true</EmbedUntrackedSources>
          <IncludeSymbols>true</IncludeSymbols>
          <SymbolPackageFormat>snupkg</SymbolPackageFormat>
          <LangVersion>Latest</LangVersion>
          <Version>3.0.7</Version>
        </PropertyGroup>
        <ItemGroup>
          <PackageReference Include=\\"Microsoft.SourceLink.GitHub\\" Version=\\"1.1.1\\" PrivateAssets=\\"All\\"/>
        </ItemGroup>

        <ItemGroup>
          <None Include=\\"..\\\\..\\\\LICENSE\\" Pack=\\"true\\" Visible=\\"false\\" PackagePath=\\"\\"/>
          <None Include=\\"..\\\\..\\\\README.md\\" Pack=\\"true\\" Visible=\\"false\\" PackagePath=\\"\\"/>
        </ItemGroup>

      </Project>
      "
    `)
  })
  it('gets latest version from .csproj', async () => {
    expect(await getXmlVersion('./test/fixtures/test.csproj')).toBe('2.9.7')
  })
  it('verifies present of dotnet', async () => {
    expect(await shelljs.which('dotnet')).toBeTruthy()
  })
})
