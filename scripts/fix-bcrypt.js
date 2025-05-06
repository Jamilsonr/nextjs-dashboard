// Script para verificar e corrigir problemas com o bcrypt no ambiente Vercel

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando script de correção do bcrypt...');

// Função para verificar se um diretório existe
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Função para listar arquivos em um diretório recursivamente
function listFilesRecursively(dir) {
  if (!dirExists(dir)) return [];
  
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(listFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  
  return results;
}

try {
  // Informações do ambiente
  console.log(`Node.js versão: ${process.version}`);
  console.log(`Plataforma: ${process.platform}, Arquitetura: ${process.arch}`);
  
  // Caminho para o módulo bcrypt
  const bcryptPath = path.resolve('./node_modules/bcrypt');
  
  if (dirExists(bcryptPath)) {
    console.log(`Módulo bcrypt encontrado em: ${bcryptPath}`);
    
    // Verificar a estrutura do diretório
    console.log('Verificando estrutura do diretório bcrypt...');
    const libPath = path.join(bcryptPath, 'lib');
    const bindingPath = path.join(libPath, 'binding');
    
    if (dirExists(libPath)) {
      console.log('Diretório lib encontrado');
    } else {
      console.log('Diretório lib não encontrado, criando...');
      fs.mkdirSync(libPath, { recursive: true });
    }
    
    if (dirExists(bindingPath)) {
      console.log('Diretório binding encontrado');
      
      // Listar arquivos no diretório binding
      const bindingFiles = listFilesRecursively(bindingPath);
      console.log('Arquivos encontrados em binding:');
      bindingFiles.forEach(file => console.log(` - ${file}`));
      
      // Verificar se existem arquivos .node
      const nodeFiles = bindingFiles.filter(file => file.endsWith('.node'));
      if (nodeFiles.length > 0) {
        console.log('Arquivos .node encontrados:');
        nodeFiles.forEach(file => console.log(` - ${file}`));
      } else {
        console.log('Nenhum arquivo .node encontrado, tentando compilar...');
      }
    } else {
      console.log('Diretório binding não encontrado, criando...');
      fs.mkdirSync(bindingPath, { recursive: true });
    }
    
    // Tentar diferentes métodos de compilação
    console.log('\nTentando diferentes métodos de compilação:');
    
    // Método 1: pnpm rebuild
    try {
      console.log('\nMétodo 1: pnpm rebuild bcrypt');
      execSync('pnpm rebuild bcrypt', { stdio: 'inherit' });
      console.log('pnpm rebuild bcrypt executado com sucesso');
    } catch (err) {
      console.error('Erro ao executar pnpm rebuild bcrypt:', err.message);
    }
    
    // Método 2: script de build do bcrypt
    try {
      const buildScriptPath = path.join(bcryptPath, 'scripts/build-bcrypt.js');
      if (fileExists(buildScriptPath)) {
        console.log('\nMétodo 2: Executando script build-bcrypt.js');
        execSync(`node ${buildScriptPath}`, { stdio: 'inherit' });
        console.log('Script build-bcrypt.js executado com sucesso');
      } else {
        console.log('Script build-bcrypt.js não encontrado');
      }
    } catch (err) {
      console.error('Erro ao executar script build-bcrypt.js:', err.message);
    }
    
    // Método 3: node-gyp diretamente
    try {
      console.log('\nMétodo 3: node-gyp rebuild');
      execSync('npx node-gyp rebuild', { cwd: bcryptPath, stdio: 'inherit' });
      console.log('node-gyp rebuild executado com sucesso');
    } catch (err) {
      console.error('Erro ao executar node-gyp rebuild:', err.message);
    }
    
    // Verificar novamente se os arquivos .node foram criados
    if (dirExists(bindingPath)) {
      const bindingFiles = listFilesRecursively(bindingPath);
      const nodeFiles = bindingFiles.filter(file => file.endsWith('.node'));
      
      console.log('\nVerificação final:');
      if (nodeFiles.length > 0) {
        console.log('Arquivos .node encontrados após compilação:');
        nodeFiles.forEach(file => console.log(` - ${file}`));
        console.log('Compilação do bcrypt concluída com sucesso!');
      } else {
        console.log('Nenhum arquivo .node encontrado após tentativas de compilação.');
        console.log('A compilação do bcrypt pode ter falhado.');
      }
    }
  } else {
    console.log('Módulo bcrypt não encontrado. Verifique se ele está instalado corretamente.');
  }
} catch (error) {
  console.error('Erro no script de correção do bcrypt:', error);
}

console.log('Script de correção do bcrypt concluído!');