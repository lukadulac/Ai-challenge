// Project-wide, so it also compiles the shared contract imported from the backend workspace.
module.exports = function (api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"] };
};
