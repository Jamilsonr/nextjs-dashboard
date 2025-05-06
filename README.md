## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## Solução para Deploy no Vercel

### Problema Identificado

O projeto estava enfrentando um erro durante o build no Vercel relacionado ao módulo `bcrypt`. O erro específico era:

```
Cannot find module '/vercel/path0/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node'
```

Este erro ocorre porque o `bcrypt` precisa compilar código nativo durante a instalação, mas o Vercel estava ignorando os scripts de build do pacote, como indicado pelo aviso:

```
Ignored build scripts: bcrypt, sharp.
```

### Solução Implementada

Foram criados dois arquivos de configuração para resolver o problema:

#### 1. vercel.json

Este arquivo configura o ambiente de build do Vercel para permitir a compilação do bcrypt:

```json
{
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "installCommand": "pnpm install --no-frozen-lockfile && pnpm approve-builds bcrypt"
}
```

A configuração `installCommand` instrui o Vercel a aprovar explicitamente a compilação do pacote bcrypt durante a instalação.

#### 2. .npmrc

Este arquivo configura o comportamento do pnpm para garantir que o bcrypt seja instalado corretamente:

```
enable-pre-post-scripts=true
node-linker=hoisted
prefer-frozen-lockfile=false
public-hoist-pattern[]=*bcrypt*
```

Com essas configurações, o deploy no Vercel deve ser concluído com sucesso.
