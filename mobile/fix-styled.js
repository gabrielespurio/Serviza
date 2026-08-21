const fs = require('fs');
const path = require('path');

const directoriesToScan = ['./src/screens', './src/components'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remover o import
  content = content.replace(/import\s*{\s*styled\s*}\s*from\s*['"]nativewind['"];?\s*\n?/g, '');

  // Remover as declarações styled
  content = content.replace(/const\s+Styled(View|Text|TouchableOpacity|SafeArea|ScrollView|TextInput)\s*=\s*styled\((.*?)\);?\s*\n?/g, '');
  // Apanhar casos como StyledSafeArea = styled(SafeAreaView)
  content = content.replace(/const\s+Styled[A-Za-z0-9_]+\s*=\s*styled\([A-Za-z0-9_]+\);?\s*\n?/g, '');

  // Substituir os usos
  content = content.replace(/<StyledView/g, '<View');
  content = content.replace(/<\/StyledView>/g, '</View>');
  
  content = content.replace(/<StyledText/g, '<Text');
  content = content.replace(/<\/StyledText>/g, '</Text>');
  
  content = content.replace(/<StyledTouchableOpacity/g, '<TouchableOpacity');
  content = content.replace(/<\/StyledTouchableOpacity>/g, '</TouchableOpacity>');
  
  content = content.replace(/<StyledSafeArea/g, '<SafeAreaView');
  content = content.replace(/<\/StyledSafeArea>/g, '</SafeAreaView>');
  
  content = content.replace(/<StyledScrollView/g, '<ScrollView');
  content = content.replace(/<\/StyledScrollView>/g, '</ScrollView>');
  
  content = content.replace(/<StyledTextInput/g, '<TextInput');
  content = content.replace(/<\/StyledTextInput>/g, '</TextInput>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

directoriesToScan.forEach(scanDir);
console.log('All files fixed!');
