// Script específico para resolver o problema do bcrypt no ambiente Vercel
// Foca especificamente no erro: Cannot find module '/vercel/path0/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node'

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Iniciando script de correção específica para o bcrypt no Vercel...');

// Detectar ambiente Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`Executando em ambiente Vercel: ${isVercel ? 'Sim' : 'Não'}`);

try {
  // Informações do ambiente
  console.log(`Node.js versão: ${process.version}`);
  console.log(`Plataforma: ${process.platform}, Arquitetura: ${process.arch}`);
  
  // Caminho para o módulo bcrypt
  const bcryptPath = isVercel ? '/vercel/path0/node_modules/bcrypt' : path.resolve('./node_modules/bcrypt');
  
  if (fs.existsSync(bcryptPath)) {
    console.log(`Módulo bcrypt encontrado em: ${bcryptPath}`);
    
    // Verificar a estrutura do diretório
    const libPath = path.join(bcryptPath, 'lib');
    const bindingPath = path.join(libPath, 'binding');
    const napiV3Path = path.join(bindingPath, 'napi-v3');
    
    // Garantir que os diretórios existam
    if (!fs.existsSync(libPath)) {
      console.log('Criando diretório lib...');
      fs.mkdirSync(libPath, { recursive: true });
    }
    
    if (!fs.existsSync(bindingPath)) {
      console.log('Criando diretório binding...');
      fs.mkdirSync(bindingPath, { recursive: true });
    }
    
    if (!fs.existsSync(napiV3Path)) {
      console.log('Criando diretório napi-v3...');
      fs.mkdirSync(napiV3Path, { recursive: true });
    }
    
    // Verificar se o arquivo binário existe
    const binaryPath = path.join(napiV3Path, 'bcrypt_lib.node');
    if (fs.existsSync(binaryPath)) {
      console.log(`Arquivo binário encontrado: ${binaryPath}`);
    } else {
      console.log(`Arquivo binário não encontrado: ${binaryPath}`);
      console.log('Tentando compilar o bcrypt...');
      
      // Tentar compilar o bcrypt
      try {
        console.log('Executando node-pre-gyp install...');
        execSync('npx node-pre-gyp install --fallback-to-build', {
          cwd: bcryptPath,
          stdio: 'inherit'
        });
      } catch (err) {
        console.error('Erro ao executar node-pre-gyp:', err.message);
        
        try {
          console.log('Tentando compilar com node-gyp...');
          execSync('npx node-gyp rebuild', {
            cwd: bcryptPath,
            stdio: 'inherit'
          });
        } catch (gypErr) {
          console.error('Erro ao executar node-gyp:', gypErr.message);
        }
      }
      
      // Verificar novamente se o arquivo binário foi criado
      if (fs.existsSync(binaryPath)) {
        console.log(`Arquivo binário criado com sucesso: ${binaryPath}`);
      } else {
        console.log(`Arquivo binário ainda não encontrado após compilação: ${binaryPath}`);
        
        // Procurar por qualquer arquivo .node gerado
        console.log('Procurando por arquivos .node em todo o diretório bcrypt...');
        let foundNodeFiles = [];
        
        function findNodeFiles(dir) {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              findNodeFiles(fullPath);
            } else if (file.endsWith('.node')) {
              foundNodeFiles.push(fullPath);
            }
          }
        }
        
        try {
          findNodeFiles(bcryptPath);
          
          if (foundNodeFiles.length > 0) {
            console.log('Arquivos .node encontrados:');
            foundNodeFiles.forEach(file => console.log(` - ${file}`));
            
            // Tentar copiar o primeiro arquivo .node encontrado para o local esperado
            if (!fs.existsSync(napiV3Path)) {
              fs.mkdirSync(napiV3Path, { recursive: true });
            }
            
            fs.copyFileSync(foundNodeFiles[0], binaryPath);
            console.log(`Copiado ${foundNodeFiles[0]} para ${binaryPath}`);
          } else {
            console.log('Nenhum arquivo .node encontrado em todo o diretório bcrypt.');
          }
        } catch (searchErr) {
          console.error('Erro ao procurar arquivos .node:', searchErr);
        }
      }
    }
  } else {
    console.log(`Módulo bcrypt não encontrado em: ${bcryptPath}`);
  }
  
  console.log('Script de correção específica para o bcrypt concluído!');
} catch (error) {
  console.error('Erro no script de correção específica para o bcrypt:', error);
  // Não falhar o build por causa deste script
  process.exit(0);
}