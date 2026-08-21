const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// ========= OTIMIZAÇÕES DE PERFORMANCE DO METRO BUNDLER =========

// 1. Usar múltiplos workers paralelos
config.maxWorkers = 4;

// 2. Reduzir extensões escaneadas — menos I/O no disco  
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'json', 'mjs'];

// 3. Habilitar exports map do package.json para pacotes modernos como axios e nativewind
config.resolver.unstable_enablePackageExports = true;

// 4. Interceptor personalizado de resolução para contornar warnings e fallback do lucide-react-native
const path = require("path");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("lucide-react-native/dist/esm/icons/")) {
    const iconFile = moduleName.replace("lucide-react-native/dist/esm/icons/", "");
    const fullPath = path.join(__dirname, "node_modules/lucide-react-native/dist/esm/icons", iconFile);
    return {
      filePath: fullPath,
      type: "sourceFile",
    };
  }
  // Deixa o Metro resolver os demais módulos normalmente
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
