// Configuração específica para o build no Vercel
// Este arquivo ajuda a garantir que módulos nativos como bcrypt sejam compilados corretamente

module.exports = {
  // Garantir que os scripts de compilação nativa sejam executados
  installCommand: 'pnpm install --no-frozen-lockfile && pnpm rebuild bcrypt',
  // Desativar telemetria do Next.js
  env: {
    NEXT_TELEMETRY_DISABLED: '1'
  }
};