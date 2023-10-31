export const knownDotNetFiles = (path: string) => {
  if (path.endsWith('.csproj'))
    return { type: 'xml', updatePath: '//Project/PropertyGroup/Version' }
  if (path.endsWith('Directory.Build.props'))
    return { type: 'xml', updatePath: '//Project/PropertyGroup/Version' }
}
