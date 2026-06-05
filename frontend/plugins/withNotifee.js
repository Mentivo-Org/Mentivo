const { withProjectBuildGradle } = require("@expo/config-plugins");

const withNotifeeRepository = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addNotifeeRepository(
        config.modResults.contents,
      );
    }
    return config;
  });
};

function addNotifeeRepository(buildGradle) {
  const notifeeRepo =
    'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

  if (buildGradle.includes(notifeeRepo)) {
    return buildGradle;
  }

  // Inject into allprojects.repositories block
  const searchPattern = /allprojects\s*{\s*repositories\s*{/;
  const replacement = `allprojects {
      repositories {
          ${notifeeRepo}`;

  if (searchPattern.test(buildGradle)) {
    return buildGradle.replace(searchPattern, replacement);
  }

  return buildGradle;
}

module.exports = withNotifeeRepository;
