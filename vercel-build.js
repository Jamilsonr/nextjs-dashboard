// Script auxiliar para garantir a compilação correta do bcrypt no ambiente Vercel

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

console.log('Iniciando script de pré-build para garantir compilação do bcrypt...');

try {
  // Verificar se o bcrypt está instalado
  const bcryptPath = path.resolve('./node_modules/bcrypt');
  
  if (fs.existsSync(bcryptPath)) {
    console.log('Módulo bcrypt encontrado, tentando compilar...');
    
    // Verificar a versão do Node.js
    const nodeVersion = process.version;
    console.log(`Versão do Node.js: ${nodeVersion}`);
    
    // Verificar a arquitetura do sistema
    const arch = process.arch;
    const platform = process.platform;
    console.log(`Plataforma: ${platform}, Arquitetura: ${arch}`);
    
    // Tentar compilar o bcrypt de várias maneiras
    try {
      // Método 1: Usar pnpm rebuild
      console.log('Método 1: Executando pnpm rebuild bcrypt...');
      execSync('pnpm rebuild bcrypt', { stdio: 'inherit' });
      
      // Método 2: Executar o script de build diretamente
      console.log('Método 2: Executando script de build do bcrypt...');
      const buildScriptPath = path.join(bcryptPath, 'scripts/build-bcrypt.js');
      if (fs.existsSync(buildScriptPath)) {
        execSync(`node ${buildScriptPath}`, { stdio: 'inherit' });
      } else {
        console.log('Script build-bcrypt.js não encontrado');
      }
      
      // Método 3: Usar node-gyp diretamente
      console.log('Método 3: Tentando compilar com node-gyp...');
      const gypResult = spawnSync('npx', ['node-gyp', 'rebuild'], {
        cwd: bcryptPath,
        stdio: 'inherit',
        shell: true
      });
      
      if (gypResult.error) {
        console.error('Erro ao executar node-gyp:', gypResult.error);
      }
      
      // Verificar se o arquivo binário foi criado
      const bindingPath = path.join(bcryptPath, 'lib/binding');
      if (fs.existsSync(bindingPath)) {
        console.log('Diretório binding encontrado, verificando arquivos...');
        const files = fs.readdirSync(bindingPath, { recursive: true });
        console.log('Arquivos em binding:', files);
        
        // Verificar se existem arquivos .node
        const nodeFiles = files.filter(file => file.endsWith('.node'));
        if (nodeFiles.length > 0) {
          console.log('Arquivos .node encontrados:', nodeFiles);
        } else {
          console.log('Nenhum arquivo .node encontrado no diretório binding');
        }
      } else {
        console.log('Diretório binding não encontrado');
      }
      
      console.log('Tentativas de compilação do bcrypt concluídas!');
    } catch (rebuildError) {
      console.error('Erro ao compilar bcrypt:', rebuildError);
      console.log('Todas as tentativas de compilação falharam.');
    }
  } else {
    console.log('Módulo bcrypt não encontrado no node_modules');
  }
  
  console.log('Script de pré-build concluído!');
} catch (error) {
  console.error('Erro no script de pré-build:', error);
  // Não falhar o build por causa deste script
  process.exit(0);
}