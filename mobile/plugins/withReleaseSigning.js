const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Signs release builds (APK and AAB) with the SokoLink upload key instead of
 * the debug key. The key and its passwords live in mobile/credentials/
 * (gitignored); without that folder release builds fall back to debug signing.
 */
const SIGNING = `
    signingConfigs {
        release {
            def props = new Properties()
            def propsFile = rootProject.file("../credentials/keystore.properties")
            if (propsFile.exists()) {
                propsFile.withInputStream { props.load(it) }
                storeFile rootProject.file("../credentials/" + props["storeFile"])
                storePassword props["storePassword"]
                keyAlias props["keyAlias"]
                keyPassword props["keyPassword"]
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes("credentials/keystore.properties")) {
      gradle = gradle.replace(/\n\s*signingConfigs \{/, SIGNING);
      gradle = gradle.replace(
        /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
        `$1signingConfig rootProject.file("../credentials/keystore.properties").exists() ? signingConfigs.release : signingConfigs.debug`,
      );
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
