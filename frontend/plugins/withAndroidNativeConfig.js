const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // 1. Inject REACT_NATIVE_RELEASE_LEVEL buildConfigField into defaultConfig
      const buildConfigLine = 'buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\\"\\${findProperty(\'reactNativeReleaseLevel\') ?: \'stable\'}\\"\\"';
      if (!contents.includes('REACT_NATIVE_RELEASE_LEVEL')) {
        console.log('withAndroidNativeConfig: Injecting REACT_NATIVE_RELEASE_LEVEL');
        contents = contents.replace(
          /defaultConfig\s*\{/,
          `defaultConfig {
        ${buildConfigLine}`
        );
      }

      // 2. Inject Custom Signing Config logic into the signingConfigs block
      if (!contents.includes('RELEASE_STORE_FILE')) {
        console.log('withAndroidNativeConfig: Injecting custom release signing logic into signingConfigs');
        const customSigningConfigs = `
        release {
            if(project.hasProperty('RELEASE_STORE_FILE')) {
                storeFile file(RELEASE_STORE_FILE)
                storePassword RELEASE_STORE_PASSWORD
                keyAlias RELEASE_KEY_ALIAS
                keyPassword RELEASE_KEY_PASSWORD
            }
        }`;

        contents = contents.replace(
          /signingConfigs\s*\{/,
          `signingConfigs {${customSigningConfigs}`
        );
      }

      // 3. Ensure the release buildType uses signingConfigs.release.
      //
      // (?:[^{}]|\{[^{}]*\})*?  handles one level of brace nesting so we skip
      // past the entire `debug { ... }` block before matching `release {`.
      // Using a capture group ($1) means we never touch the debug block's
      // signingConfig — only the release block's line is rewritten.
      const buildTypesReleaseRegex =
        /(buildTypes\s*\{(?:[^{}]|\{[^{}]*\})*?\brelease\s*\{[^}]*)signingConfig\s+signingConfigs\.debug/;

      if (buildTypesReleaseRegex.test(contents)) {
        console.log('withAndroidNativeConfig: Switching release buildType signingConfig to signingConfigs.release');
        contents = contents.replace(
          buildTypesReleaseRegex,
          '$1signingConfig signingConfigs.release'
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });
};