module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // WatermelonDB utilise les décorateurs "stage-1" (legacy), pas les TC39 finaux.
      // Ce plugin doit être listé AVANT babel-preset-expo pour s'exécuter en premier.
      // En pratique Babel exécute les plugins avant les presets, donc l'ordre est correct.
      ['@babel/plugin-proposal-decorators', { legacy: true }],
    ],
  };
};
