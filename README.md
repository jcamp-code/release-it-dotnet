# release-it-dotnet

## DotNet NuGet and Versioning plugin for Release It!

This plugin adds the following with [Release It!](https://github.com/release-it/release-it)

- Enables retrieving and setting the version from a .csproj file or Directory.Build.props file
- Automatic NuGet publishing
- Enables [dotenv](https://github.com/motdotla/dotenv) integration automatically; no need to configure it separately

Both versioning and NuGet options can be enabled or disabled as needed.

### Installation

```
npm install -D release-it-dotnet
```

In [release-it](https://github.com/release-it/release-it) config:

```js
plugins: {
  'release-it-dotnet': {
    csprojFile: './src/Test.csproj'
    // or
    versionFile: './src/Directory.Build.props'
  },
}
```

### Configuration Options

#### `csprojFile?: string`

Required if `versionFile` not set: This is the csproj file to pack and publish, and store and set the version in. Can also be the solution file if you're publishing multiple packages.

#### `versionFile?: string | false`

Required if `csprojFile` not set. If you want to store and set the version in a different file, set it here. Supports `.csproj` and `Directory.Build.props` files

#### `nugetFeedUrl?: string`

If you want to publish to a NuGet feed other than the default, specify it here

#### `nugetApiKey?: string`

You can set the NuGet API key, or by using a `NUGET_API_KEY` environment variable

#### `packageId?: string`

Override the package ID. Defaults to the package ID in the referenced .csproj file, or the .csproj file name if none. Only used for displaying package name in prompts

#### `publish: boolean`

DefaultL `true`. Disable publishing the NuGet package

#### `pack: boolean`

If `publish` is true, this will be set to true automatically. You can also set it to pack if publishing is turned off.

#### `buildConfiguration: string`

Default: `Release`. Override which build configuration to use for packing and publishing

#### `keepArtifacts: boolean`

Default: `false`. If you want to keep the artifacts generated by the pack process, set this to `true`

#### `extraFiles?: string | string[]`

Any extra files to update the version in. Supports `.csproj` and `Directory.Build.props` files
