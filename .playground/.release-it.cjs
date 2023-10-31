/* eslint-disable no-template-curly-in-string */
module.exports = {
  plugins: {
    '../dist/index.mjs': {
      nugetFeedUrl: '',
      nugetApiKey: '',
      keepArtifacts: true,
      publish: true,
      csprojFile: './src/ClassLibrary1/ClassLibrary1.csproj',
      extraFiles: ['./Directory.Build.props'],
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
