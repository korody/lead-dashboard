# Configuração de Variáveis de Ambiente - Vercel

## 📋 Variáveis Necessárias para Produção

Configure as seguintes variáveis de ambiente no painel do Vercel para ativar todas as funcionalidades do dashboard:

### 1. ElevenLabs (Geração de Áudio com IA)

```
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **Onde obter**: [ElevenLabs API Keys](https://elevenlabs.io/app/settings/api-keys)
- **Função**: Gera áudios personalizados com voz de IA para envio via WhatsApp
- **Obrigatória**: Sim (para funcionalidade de áudio)

### 2. Supabase (Storage e Database)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
```

- **Onde obter**: [Supabase Project Settings](https://supabase.com/dashboard/project/_/settings/api)
- **Função**: 
  - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública para leitura (já configurada)
  - `SUPABASE_SERVICE_ROLE_KEY`: Chave privada para upload de arquivos no Storage
- **Obrigatória**: Sim (SERVICE_ROLE_KEY necessária para upload de áudio)

### 3. Unnichat (Envio Direto de WhatsApp)

```
UNNICHAT_API_URL=https://unnichat.com.br/api
UNNICHAT_ACCESS_TOKEN=Bearer_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **Onde obter**: Painel do Unnichat → Settings → API Access Token
- **Função**: 
  - `UNNICHAT_API_URL`: URL base da API do Unnichat (padrão já configurado)
  - `UNNICHAT_ACCESS_TOKEN`: Token de autenticação para envio direto de mensagens
- **Obrigatória**: Sim (para envio direto de áudio via WhatsApp)
- **Formato**: O token deve incluir "Bearer_" no início

### 4. WhatsApp (Opcional - Modo Simulação)

```
WHATSAPP_SIMULATION_MODE=false
```

- **Valores aceitos**: `true` ou `false`
- **Função**: Se `true`, simula envios sem chamar APIs reais (útil para testes)
- **Obrigatória**: Não (padrão: `false` em produção)
- **Recomendação**: Deixe `false` em produção, `true` em staging/desenvolvimento

---

## 🚀 Como Configurar no Vercel

### Passo a Passo:

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione o projeto `lead-dashboard`
3. Vá em **Settings** → **Environment Variables**
4. Para cada variável acima:
   - Clique em **Add New**
   - Cole o **Key** (nome da variável)
   - Cole o **Value** (valor da variável)
   - Selecione os ambientes: **Production**, **Preview**, **Development**
   - Clique em **Save**

### Importante:

- ✅ **NEXT_PUBLIC_*** são variáveis públicas (expostas no cliente)
- 🔒 **Sem prefixo** são variáveis privadas (apenas no servidor)
- ⚠️ Após adicionar/alterar variáveis, **redeploy o projeto** para aplicar

---

## 🎯 Checklist de Variáveis

Marque conforme for configurando:

- [ ] `ELEVENLABS_API_KEY` - Chave da API ElevenLabs
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase (já deve estar configurada)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase (já deve estar configurada)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase (NOVA - obrigatória)
- [ ] `UNNICHAT_API_URL` - URL da API Unnichat (padrão: https://unnichat.com.br/api)
- [ ] `UNNICHAT_ACCESS_TOKEN` - Token de acesso Unnichat (NOVA - obrigatória)
- [ ] `WHATSAPP_SIMULATION_MODE` - Modo simulação (opcional, false em produção)

---

## 🧪 Testando a Configuração

Após configurar todas as variáveis e fazer o redeploy:

1. Acesse o dashboard em produção: `https://dash.mestreye.com`
2. Navegue para `/leads`
3. Clique em um lead para abrir o modal
4. **Teste 1 - Envio Direto de Áudio**:
   - Clique em **"Enviar Script por Áudio (janela aberta)"**
   - Verifique logs em tempo real no painel
   - Confirme recebimento no WhatsApp (áudio + link CTA)
5. **Teste 2 - Automação**:
   - Clique em **"Inserir na Automação (janela fechada)"**
   - Verifique disparo da automação Unnichat
6. Verifique:
   - ✅ Logs aparecem no painel
   - ✅ Mensagem de sucesso é exibida
   - ✅ Áudio é gerado e enviado
   - ✅ Arquivo aparece no Supabase Storage (`audio-mensagens` bucket)
   - ✅ Lead recebe áudio + link CTA no WhatsApp

---

## 🔍 Verificando Buckets no Supabase

Certifique-se de que o bucket `audio-mensagens` está configurado:

1. Acesse [Supabase Storage](https://supabase.com/dashboard/project/_/storage/buckets)
2. Verifique se existe o bucket `audio-mensagens`
3. Se não existir, crie com as configurações:
   - **Name**: `audio-mensagens`
   - **Public**: ✅ Yes (para gerar URLs públicas)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: `audio/mpeg`, `audio/mp3`

---

## 🆕 Novo: Diferenças entre Envio Direto e Automação

### Envio Direto (Botão Roxo)
- 🚀 **Mais rápido**: ~15-30 segundos
- 📱 **WhatsApp aberto**: Lead precisa estar com janela ativa
- 🎯 **Controle total**: API envia diretamente áudio + CTA
- ✅ **Uso**: Envio individual on-demand
- 📊 **Status**: `audio_direto_enviado`

### Automação (Botão Cinza)
- ⏳ **Mais demorado**: ~30-60 segundos
- 🤖 **WhatsApp fechado**: Lead pode estar offline
- 🔄 **Fluxo automatizado**: Unnichat gerencia todo o fluxo
- ✅ **Uso**: Envio em massa ou sequências
- 📊 **Status**: `automacao_iniciada`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no Vercel: **Deployments** → Último deploy → **Functions** → **Logs**
2. Confirme que todas as variáveis estão preenchidas corretamente
3. Teste em modo simulação primeiro (`WHATSAPP_SIMULATION_MODE=true`)
4. Verifique se o bucket `audio-mensagens` existe e está público
5. Confirme que o token Unnichat tem permissões de envio

---

## 🎉 Pronto!

Com todas as variáveis configuradas, o sistema estará 100% funcional em produção, incluindo:

- ✅ Geração de áudio personalizado com ElevenLabs
- ✅ Upload automático para Supabase Storage
- ✅ **NOVO**: Envio direto via WhatsApp (sem automação)
- ✅ Envio via automação Unnichat (fluxo completo)
- ✅ Logs em tempo real no dashboard
- ✅ Segmentação automática (aluno vs não-aluno)
- ✅ Links CTA personalizados por segmento
