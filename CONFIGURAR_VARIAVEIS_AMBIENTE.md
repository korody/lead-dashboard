# 🔑 Como Configurar as Variáveis de Ambiente

## ⚠️ IMPORTANTE: Variáveis Faltando

O envio de áudio direto requer as seguintes variáveis de ambiente configuradas no arquivo `.env.local`:

---

## 1️⃣ SUPABASE_SERVICE_ROLE_KEY

**O que é:** Chave secreta para fazer upload de arquivos no Supabase Storage.

**Como pegar:**
1. Acesse: https://app.supabase.com/project/kfkhdfnkwhljhhjcvbqp/settings/api
2. Na seção **Project API keys**
3. Copie a chave **`service_role`** (Secret)
4. Cole no `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2hkZm5rd2hsamhoamN2YnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDgzNzU5NSwiZXhwIjoyMDQ2NDEzNTk1fQ.XXXXX
```

⚠️ **NUNCA compartilhe essa chave!** Ela tem acesso total ao banco de dados.

---

## 2️⃣ ELEVENLABS_API_KEY

**O que é:** Chave de API para gerar áudios com inteligência artificial (voz do Mestre Ye).

**Como pegar:**
1. Acesse: https://elevenlabs.io/
2. Faça login com sua conta
3. Vá em **Profile → API Keys**
4. Copie a API Key
5. Cole no `.env.local`:

```bash
ELEVENLABS_API_KEY=sk_1234567890abcdef
```

**Custo:** ~$0.30 por minuto de áudio gerado. Plano gratuito: 10.000 caracteres/mês.

---

## 3️⃣ UNNICHAT_ACCESS_TOKEN

**O que é:** Token de autenticação para enviar mensagens via WhatsApp através da API Unnichat.

**Como pegar:**
1. Acesse o painel Unnichat: https://unnichat.com.br/
2. Vá em **Configurações → API → Access Tokens**
3. Copie o token de acesso
4. Cole no `.env.local`:

```bash
UNNICHAT_ACCESS_TOKEN=Bearer_seu_token_aqui
```

⚠️ **Formato:** Deve começar com `Bearer_` se o sistema Unnichat exigir.

---

## 4️⃣ WHATSAPP_SIMULATION_MODE (Opcional)

**O que é:** Modo de simulação para testar sem enviar mensagens reais.

**Valores:**
- `true` = Apenas simula o envio (não gasta créditos)
- `false` ou vazio = Envia mensagens reais

**Configuração padrão (desenvolvimento):**
```bash
WHATSAPP_SIMULATION_MODE=true
```

**Em produção:** Remova ou defina como `false`.

---

## ✅ Checklist de Configuração

Após pegar todas as chaves, seu `.env.local` deve ter:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Chave service_role do Supabase
- [ ] `ELEVENLABS_API_KEY` - API Key do ElevenLabs
- [ ] `UNNICHAT_ACCESS_TOKEN` - Token de acesso do Unnichat
- [ ] `WHATSAPP_SIMULATION_MODE=true` - Modo simulação ativo

---

## 🚀 Após Configurar

1. Salve o arquivo `.env.local`
2. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C no terminal)
   # Inicie novamente:
   npm run dev
   ```
3. Teste o botão **"Enviar Script por Áudio (janela aberta)"**
4. Verifique os logs no painel para confirmar o funcionamento

---

## 🔒 Segurança

⚠️ **NUNCA COMPARTILHE** estas chaves:
- `SUPABASE_SERVICE_ROLE_KEY` (acesso total ao banco)
- `ELEVENLABS_API_KEY` (gasta créditos da sua conta)
- `UNNICHAT_ACCESS_TOKEN` (envia mensagens do seu WhatsApp)

✅ O arquivo `.env.local` está no `.gitignore` e não será enviado ao GitHub.

---

## 📝 Logs de Debug

Se algo não funcionar, verifique os logs do servidor:
1. Abra o terminal onde o servidor está rodando
2. Procure por mensagens como:
   - `⚠️ Variáveis de ambiente do Supabase não configuradas!`
   - `❌ ELEVENLABS_API_KEY não configurada`
   - `❌ UNNICHAT_ACCESS_TOKEN não configurada`

---

## 🆘 Precisa de Ajuda?

Se tiver dificuldade para encontrar alguma chave:
1. Verifique o email de confirmação dos serviços
2. Entre em contato com o suporte técnico de cada plataforma
3. Consulte a documentação oficial:
   - Supabase: https://supabase.com/docs
   - ElevenLabs: https://elevenlabs.io/docs
   - Unnichat: [documentação fornecida pelo fornecedor]
