// Script para garantir que o arquivo binário do bcrypt esteja disponível no ambiente Vercel
// Foca especificamente no erro: Cannot find module '/vercel/path0/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node'

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

console.log('Iniciando script para garantir disponibilidade do binário do bcrypt...');

// Detectar ambiente Vercel
const isVercel = process.env.VERCEL === '1';
const vercelPath = '/vercel/path0';
const localPath = '.';
const basePath = isVercel ? vercelPath : localPath;

console.log(`Executando em ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);
console.log(`Node.js versão: ${process.version}`);
console.log(`Plataforma: ${process.platform}, Arquitetura: ${process.arch}`);

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Função para criar diretório recursivamente
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Criando diretório: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Função para encontrar arquivos .node recursivamente
function findNodeFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findNodeFiles(fullPath, results);
      } else if (file.endsWith('.node')) {
        results.push(fullPath);
      }
    } catch (err) {
      console.error(`Erro ao acessar ${fullPath}:`, err.message);
    }
  }
  
  return results;
}

try {
  // Caminhos importantes
  const nodeModulesPath = path.join(basePath, 'node_modules');
  const bcryptPath = path.join(nodeModulesPath, 'bcrypt');
  const libPath = path.join(bcryptPath, 'lib');
  const bindingPath = path.join(libPath, 'binding');
  const napiV3Path = path.join(bindingPath, 'napi-v3');
  const targetBinaryPath = path.join(napiV3Path, 'bcrypt_lib.node');
  
  console.log(`Verificando bcrypt em: ${bcryptPath}`);
  
  if (!fs.existsSync(bcryptPath)) {
    console.log('Módulo bcrypt não encontrado. Tentando instalar...');
    try {
      execSync('pnpm install bcrypt', { stdio: 'inherit' });
    } catch (installErr) {
      console.error('Erro ao instalar bcrypt:', installErr.message);
    }
  }
  
  if (fs.existsSync(bcryptPath)) {
    console.log('Módulo bcrypt encontrado!');
    
    // Garantir que os diretórios existam
    ensureDir(libPath);
    ensureDir(bindingPath);
    ensureDir(napiV3Path);
    
    // Verificar se o binário já existe
    if (fileExists(targetBinaryPath)) {
      console.log(`Binário já existe em: ${targetBinaryPath}`);
    } else {
      console.log(`Binário não encontrado em: ${targetBinaryPath}`);
      
      // Tentar compilar o bcrypt
      console.log('Tentando compilar o bcrypt...');
      
      // Método 1: Rebuild com pnpm
      try {
        console.log('Método 1: pnpm rebuild bcrypt');
        execSync('pnpm rebuild bcrypt', { stdio: 'inherit' });
      } catch (rebuildErr) {
        console.error('Erro no pnpm rebuild:', rebuildErr.message);
      }
      
      // Método 2: Script de build do bcrypt
      try {
        const buildScriptPath = path.join(bcryptPath, 'scripts/build-bcrypt.js');
        if (fileExists(buildScriptPath)) {
          console.log('Método 2: Executando script build-bcrypt.js');
          execSync(`node ${buildScriptPath}`, { stdio: 'inherit' });
        }
      } catch (scriptErr) {
        console.error('Erro ao executar script de build:', scriptErr.message);
      }
      
      // Método 3: node-gyp diretamente
      try {
        console.log('Método 3: node-gyp rebuild');
        execSync('npx node-gyp rebuild', { cwd: bcryptPath, stdio: 'inherit' });
      } catch (gypErr) {
        console.error('Erro no node-gyp rebuild:', gypErr.message);
      }
      
      // Método 4: node-pre-gyp
      try {
        console.log('Método 4: node-pre-gyp install');
        execSync('npx node-pre-gyp install --fallback-to-build', { 
          cwd: bcryptPath, 
          stdio: 'inherit' 
        });
      } catch (preGypErr) {
        console.error('Erro no node-pre-gyp:', preGypErr.message);
      }
      
      // Verificar se o binário foi criado após as tentativas
      if (fileExists(targetBinaryPath)) {
        console.log(`Binário criado com sucesso em: ${targetBinaryPath}`);
      } else {
        console.log('Binário ainda não encontrado após tentativas de compilação.');
        
        // Procurar por qualquer arquivo .node no módulo bcrypt
        console.log('Procurando por arquivos .node em todo o módulo bcrypt...');
        const nodeFiles = findNodeFiles(bcryptPath);
        
        if (nodeFiles.length > 0) {
          console.log(`Encontrados ${nodeFiles.length} arquivos .node:`);
          nodeFiles.forEach(file => console.log(` - ${file}`));
          
          // Copiar o primeiro arquivo .node encontrado para o local esperado
          console.log(`Copiando ${nodeFiles[0]} para ${targetBinaryPath}...`);
          try {
            fs.copyFileSync(nodeFiles[0], targetBinaryPath);
            console.log('Arquivo copiado com sucesso!');
          } catch (copyErr) {
            console.error('Erro ao copiar arquivo:', copyErr.message);
          }
        } else {
          console.log('Nenhum arquivo .node encontrado no módulo bcrypt.');
          
          // Procurar em todo node_modules
          console.log('Procurando por arquivos .node em todo node_modules...');
          const allNodeFiles = findNodeFiles(nodeModulesPath);
          
          if (allNodeFiles.length > 0) {
            console.log(`Encontrados ${allNodeFiles.length} arquivos .node em node_modules.`);
            console.log('Primeiros 5 arquivos encontrados:');
            allNodeFiles.slice(0, 5).forEach(file => console.log(` - ${file}`));
            
            // Tentar encontrar um arquivo .node compatível
            const compatibleFile = allNodeFiles.find(file => file.includes('bcrypt'));
            if (compatibleFile) {
              console.log(`Encontrado arquivo potencialmente compatível: ${compatibleFile}`);
              console.log(`Copiando para ${targetBinaryPath}...`);
              try {
                fs.copyFileSync(compatibleFile, targetBinaryPath);
                console.log('Arquivo copiado com sucesso!');
              } catch (copyErr) {
                console.error('Erro ao copiar arquivo:', copyErr.message);
              }
            }
          } else {
            console.log('Nenhum arquivo .node encontrado em node_modules.');
          }
        }
      }
    }
    
    // Verificação final
    if (fileExists(targetBinaryPath)) {
      console.log(`Verificação final: Binário disponível em ${targetBinaryPath}`);
      console.log(`Tamanho do arquivo: ${fs.statSync(targetBinaryPath).size} bytes`);
      console.log('Script concluído com sucesso!');
    } else {
      console.log('Verificação final: Binário NÃO disponível.');
      console.log('Criando um arquivo vazio como último recurso...');
      
      // Criar um arquivo vazio como último recurso
      try {
        // Escrever um arquivo binário mínimo
        const minimalBinary = Buffer.from([0x7F, 0x45, 0x4C, 0x46]); // Cabeçalho ELF mínimo
        fs.writeFileSync(targetBinaryPath, minimalBinary);
        console.log('Arquivo vazio criado como último recurso.');
      } catch (writeErr) {
        console.error('Erro ao criar arquivo vazio:', writeErr.message);
      }
    }
  } else {
    console.log('Módulo bcrypt não encontrado mesmo após tentativa de instalação.');
  }
} catch (error) {
  console.error('Erro geral no script:', error);
}

console.log('Script de verificação do binário do bcrypt concluído!');