/**
 * Supprime les imports JSI legacy injectés par @morrowdigital/watermelondb-expo-plugin.
 * JSIModulePackage / getJSIModulePackage() n'existent plus dans React Native 0.71+.
 * Avec newArchEnabled: true, WatermelonDB JSI passe par les TurboModules automatiquement.
 *
 * On utilise withDangerousMod (lecture/écriture directe) qui s'exécute après tous
 * les withMainApplication, garantissant qu'on supprime bien les lignes injectées.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function fixWatermelonKotlin(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = (cfg.android?.package ?? 'com.anonymous.MyPerf').replace(/\./g, '/');
      const filePath = path.join(
        cfg.modRequest.platformProjectRoot,
        `app/src/main/java/${pkg}/MainApplication.kt`,
      );

      let contents = await fs.promises.readFile(filePath, 'utf-8');

      contents = contents
        .replace(/import com\.nozbe\.watermelondb\.jsi\.WatermelonDBJSIPackage;[ \t]*\r?\n?/g, '')
        .replace(/import com\.facebook\.react\.bridge\.JSIModulePackage;[ \t]*\r?\n?/g, '')
        .replace(/[ \t]*override fun getJSIModulePackage\(\)[\s\S]*?WatermelonDBJSIPackage\(\)[\s\S]*?\}\s*\n?/g, '');

      await fs.promises.writeFile(filePath, contents);
      return cfg;
    },
  ]);
};
