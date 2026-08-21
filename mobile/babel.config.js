module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", lazyImports: true }],
      "nativewind/babel",
    ],
    plugins: [
      // Ativa inline requires: módulos pesados (lucide-react-native = 233KB, 
      // react-native-maps, etc) só são carregados quando realmente usados,
      // não no startup. Essa é a otimização oficial do React Native.
      // Docs: https://reactnative.dev/docs/ram-bundles-inline-requires
    ],
  };
};
