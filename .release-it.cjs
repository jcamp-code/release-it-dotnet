/* eslint-disable no-template-curly-in-string */
// https://github.com/release-it/release-it/blob/main/config/release-it.json
module.exports = {
  // plugins: {
  //   './dist/index.mjs': {
  //     keepArtifacts: true,
  //     publish: true,
  //     csprojFile: './src/ClassLibrary1/ClassLibrary1.csproj',
  //     extraFiles: ['./Directory.Build.props'],
  //   },
  // },
  git: {
    commit: false,
    tag: false,
    push: false,
    requireCleanWorkingDir: false,
    tagName: 'v${version}',
    commitMessage: 'chore(release): v${version}',
    tagAnnotation: 'v${version}',
  },
  github: {
    releaseName: 'v${version}',
    release: false,
    web: true,
  },
  npm: {
    publish: false,
  },
}
