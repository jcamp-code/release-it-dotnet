/* eslint-disable no-template-curly-in-string */
module.exports = {
  plugins: {
    '../dist/index.mjs': {
      nugetFeedUrl: '',
      nugetApiKey: '',
      publish: true,
      versionFile: './src/Directory.Build.props',
      csprojFile: './src/ClassLibraries.sln',
    },
  },
  git: {
    commit: false,
    tag: false,
    requireCleanWorkingDir: false,
    push: false,
    tagName: 'v${version}',
    commitMessage: 'chore(release): v${version}',
  },
  github: {
    release: false,
  },
  npm: {
    publish: false,
  },
}
