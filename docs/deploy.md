# Deploy — STI com n8n na DigitalOcean

Guia completo para publicar o MVP numa Droplet, do commit no GitHub ao teste
ponta a ponta. Feito para ser seguido na ordem, uma vez. Depois do primeiro
deploy, o dia a dia é só a seção [10. Atualizar a aplicação](#10-atualizar-a-aplicação).

---

## 0. O que vai rodar no servidor

Uma única Droplet Ubuntu com três containers na mesma rede do Docker Compose:

```
                    Internet
                       |
                  porta 80 (HTTP)
                       |
            +----------v-----------+
            |  frontend (nginx)    |
            |  - SPA do Vite       |
            |  - proxy de /api/    |
            +----+------------+----+
                 |            |
       /api/*    |            |  /  (arquivos estáticos)
                 v
        +--------+--------+          porta 5678 (só para o editor)
        | backend         |        +---------------------+
        | Express :3001   +------->|  n8n                |
        | (sem porta      |        |  volume: n8n_data/  |
        |  pública)       |        +----------+----------+
        +-----------------+                   |
                                              v
                                        Google Gemini
```

Três decisões que valem entender:

- **O backend não tem porta pública.** O nginx do container `frontend` faz proxy
  de `/api/` para `backend:3001` pela rede interna. Resultado: frontend e API na
  mesma origem — sem CORS, sem *mixed content* quando entrar HTTPS, e uma porta
  a menos exposta.
- **`VITE_API_BASE_URL=/`** faz o `App.jsx` montar URLs relativas (`/api/...`).
  É por isso que o valor em produção é `/`, e **não** `http://IP:3001`.
- **O estado real do n8n mora em `n8n_data/`**, que não vai no `git clone`.
  Ele é copiado à mão da máquina local para a Droplet (seção 5).

---

## 1. Preparação na máquina local (Windows)

### 1.1 Descobrir a versão do n8n que você usa hoje

Com a stack local no ar:

```powershell
cd C:\Users\ResTIC16\Documents\PIBIT\pibit-n8n
docker compose -f docker/docker-compose.dev.yml exec n8n n8n --version
```

Anote o número. Ele vai em `N8N_IMAGE_TAG` no `.env` do servidor. **Nunca use
`latest` em produção**: uma versão nova roda *migrations* irreversíveis no
`n8n_data/` e não dá para voltar atrás.

### 1.2 Copiar a chave de criptografia do n8n

```powershell
type n8n_data\config
```

Sai algo como `{"encryptionKey":"..."}`. Guarde esse valor — ele vai em
`N8N_ENCRYPTION_KEY` no servidor. Se a chave no `.env` divergir da que está
dentro do `n8n_data/config`, o n8n **não sobe** ("Mismatching encryption keys")
e as credenciais do Gemini ficam ilegíveis.

Trate essa chave como senha: não cole em chat, issue ou commit.

### 1.3 Commitar e enviar as mudanças para o GitHub

```powershell
git status
git add .gitattributes .gitignore .env.production.example docker docs
git commit -m "chore(deploy): configuracao de producao para a droplet"
git push origin main
```

> Se o `git status` acusar `docs/deploy.md` como *deleted*, é porque o arquivo
> tinha sido apagado localmente. O `git add docs` acima já resolve, porque a
> versão nova está de volta no lugar.

> Se aparecerem arquivos "inteiros modificados" sem você ter mexido neles, é o
> Windows trocando LF por CRLF. O `.gitattributes` novo corrige isso; para
> normalizar de uma vez: `git add --renormalize .`

### 1.4 Preparar o pacote do n8n_data

**Pare o n8n local antes de copiar.** Com ele rodando, o SQLite fica com
alterações pendentes no arquivo `-wal` e a cópia pode sair corrompida.

```powershell
docker compose -f docker/docker-compose.dev.yml down
tar -czf n8n_data.tar.gz --exclude="*.log" n8n_data local-files
```

O `.tar.gz` deve ficar na casa de poucos MB (os `n8nEventLog*.log` são a maior
parte do peso e não servem para nada no servidor novo).

---

## 2. Criar a Droplet

### 2.1 Cadastrar a chave SSH

No PowerShell, se você ainda não tiver uma:

```powershell
ssh-keygen -t ed25519 -C "laizaribeiroinfor@gmail.com"
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Copie a linha inteira (`ssh-ed25519 AAAA...`). No painel da DigitalOcean:
**Settings → Security → SSH Keys → Add SSH Key**.

Use chave SSH, não senha. Droplet com senha e porta 22 aberta é varrida por bots
em questão de minutos.

### 2.2 Criar

**Create → Droplets**, com:

| Campo | Valor |
|---|---|
| Região | **New York (NYC3)** ou **Atlanta (ATL1)** — a DigitalOcean não tem datacenter na América do Sul; esses são os mais próximos (~120–150 ms do Brasil) |
| Imagem | **Ubuntu 24.04 (LTS) x64** |
| Tipo | Basic → **Regular (SSD)** |
| Tamanho | **2 GB RAM / 1 vCPU / 50 GB — US$ 12/mês** |
| Autenticação | **SSH Key** (a que você acabou de cadastrar) |
| Hostname | `sti-n8n-prod` |

Sobre o tamanho: 1 GB não dá conta — o `vite build` roda dentro da Droplet e o
n8n sozinho já usa uns 400–500 MB. Com 2 GB sobra folga. Se o build ficar lento
demais, o plano de 2 GB / 2 vCPU (US$ 18/mês) resolve.

Backups automáticos custam +20% do valor da Droplet. Vale ligar: é o que salva o
`n8n_data/` se algo der errado.

### 2.3 Firewall (faça isso antes de subir a aplicação)

**Networking → Firewalls → Create Firewall**, regras de entrada:

| Tipo | Porta | Origem |
|---|---|---|
| SSH | 22 | **Só o seu IP** (o painel oferece "My IP") |
| HTTP | 80 | All IPv4, All IPv6 |
| HTTPS | 443 | All IPv4, All IPv6 |
| Custom TCP | 5678 | **Só o seu IP** — é o editor do n8n |

Aplique o firewall à Droplet.

> **Por que o firewall da DigitalOcean e não o `ufw`?** Porque o Docker escreve
> direto nas tabelas `nat`/`DOCKER-USER` do iptables e **passa por cima das
> regras do `ufw`**. Uma porta publicada por container fica acessível mesmo com
> o `ufw` fechado. O firewall da DigitalOcean roda fora da máquina, então
> funciona de verdade. Instale o `ufw` também, mas não confie só nele.

> **Alternativa mais segura para o n8n:** não publicar a 5678 e acessar o editor
> por túnel SSH. Em `docker/docker-compose.prod.yml`, troque
> `- "5678:5678"` por `- "127.0.0.1:5678:5678"`, e no seu PC use
> `ssh -L 5678:localhost:5678 deploy@SEU_IP`. O editor abre em
> `http://localhost:5678` e o n8n deixa de existir para a internet.

---

## 3. Preparar o servidor

### 3.1 Primeiro acesso e usuário sem root

```bash
ssh root@SEU_IP

adduser deploy                 # defina uma senha para o sudo
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/
```

Bloqueie login direto como root:

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

**Antes de fechar essa sessão**, abra outro terminal e confirme que
`ssh deploy@SEU_IP` funciona. Se não funcionar, você ainda tem a sessão root
aberta para consertar.

### 3.2 Swap e atualizações

Como `deploy`:

```bash
sudo apt update && sudo apt upgrade -y

# 2 GB de swap: rede de segurança para o build do frontend
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo apt install -y ufw fail2ban
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable
```

### 3.3 Docker

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker deploy
newgrp docker          # ou saia e entre de novo no SSH

docker compose version # precisa ser >= 2.24 para a Fase 2 (HTTPS)
```

---

## 4. Clonar o repositório

Se o repositório for **público**:

```bash
cd ~
git clone https://github.com/G-Calixto/sti-n8n.git
cd sti-n8n
```

Se for **privado**, use uma *deploy key* (chave só de leitura, específica desta
Droplet — melhor do que colocar sua senha ou um token pessoal no servidor):

```bash
ssh-keygen -t ed25519 -C "droplet-sti" -f ~/.ssh/id_deploy -N ""
cat ~/.ssh/id_deploy.pub
```

Cole a saída em **GitHub → repositório → Settings → Deploy keys → Add deploy
key** (deixe "Allow write access" desmarcado). Depois:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/id_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
git clone git@github.com:G-Calixto/sti-n8n.git
cd sti-n8n
```

---

## 5. Migrar o n8n_data

Na **máquina local** (PowerShell), com o n8n local já parado (passo 1.4):

```powershell
scp n8n_data.tar.gz deploy@SEU_IP:~/sti-n8n/
```

No **servidor**:

```bash
cd ~/sti-n8n
tar -xzf n8n_data.tar.gz
rm n8n_data.tar.gz

# O n8n roda como uid 1000 dentro do container
sudo chown -R 1000:1000 n8n_data local-files
chmod 600 n8n_data/config          # o n8n recusa o arquivo se estiver aberto demais

ls -la n8n_data/                   # database.sqlite e config precisam estar aí
```

Se você preferiu começar com um n8n limpo, pule esta seção: basta criar as
pastas (`mkdir -p n8n_data local-files && sudo chown -R 1000:1000 n8n_data local-files`)
e importar os JSONs de `n8n/workflows/` pela interface depois.

---

## 6. Criar o `.env` de produção

```bash
cd ~/sti-n8n
cp .env.production.example .env
nano .env
```

Substitua **todo** `SEU_IP_OU_DOMINIO` pelo IP da Droplet e preencha a chave:

```env
FRONTEND_ORIGIN=http://143.198.0.0
VITE_API_BASE_URL=/
N8N_EXTRACTION_WEBHOOK_URL=http://n8n:5678/webhook/extracao-otimizado
N8N_FEEDBACK_WEBHOOK_URL=http://n8n:5678/webhook/feedback-sti
N8N_ENCRYPTION_KEY=<a chave do passo 1.2>
N8N_IMAGE_TAG=<a versão do passo 1.1>
N8N_HOST=143.198.0.0
WEBHOOK_URL=http://143.198.0.0:5678/
N8N_EDITOR_BASE_URL=http://143.198.0.0:5678/
N8N_SECURE_COOKIE=false
```

```bash
chmod 600 .env
```

Três armadilhas comuns aqui:

- **`/webhook/` e não `/webhook-test/`.** O caminho `-test` só responde a uma
  chamada, depois de você clicar em "Listen for test event" no editor. Em
  produção o workflow fica ativo e atende em `/webhook/`.
- **`http://n8n:5678` e não `localhost`.** `n8n` é o nome do serviço na rede do
  Compose; dentro do container do backend, `localhost` é o próprio backend.
- **`N8N_SECURE_COOKIE=false`** enquanto for HTTP puro. Sem isso o login no
  editor falha com uma mensagem sobre cookies seguros.

---

## 7. Subir a stack

```bash
cd ~/sti-n8n
docker compose --env-file .env -f docker/docker-compose.prod.yml up -d --build
docker compose --env-file .env -f docker/docker-compose.prod.yml ps
```

> **O `--env-file .env` não é enfeite.** Quando você passa `-f docker/...`, o
> Compose assume `docker/` como diretório do projeto e vai procurar o `.env`
> lá dentro — não na raiz. Sem a flag, `${N8N_IMAGE_TAG}` e
> `${VITE_API_BASE_URL}` chegam vazios. O `image:` do n8n é propositalmente
> obrigatório (`:?`), então o Compose falha na hora em vez de subir a versão
> errada. Rode sempre a partir de `~/sti-n8n`, nunca de dentro de `docker/`.

O primeiro `--build` demora alguns minutos (baixa as imagens e roda o
`vite build`). Depois:

```bash
# a API responde por dentro do proxy?
curl -i http://localhost/api/health

# logs, se algo não subir
docker compose --env-file .env -f docker/docker-compose.prod.yml logs -f backend
docker compose --env-file .env -f docker/docker-compose.prod.yml logs -f n8n
```

Abra `http://SEU_IP` no navegador — a tela inicial do STI deve aparecer.

---

## 8. Configurar o n8n

Abra `http://SEU_IP:5678`.

### 8.1 Entrar

O `n8n_data/` migrado traz a conta dona já existente: **`gntdc@ic.ufal.br`
(Gabriel)**. Você vai precisar da senha dele. Se não tiver:

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml exec n8n n8n user-management:reset
```

Isso apaga a conta dona e libera a tela de cadastro de novo dono no próximo
acesso. **Workflows e credenciais são preservados** — só o login é resetado.

### 8.2 Conferir as credenciais do Gemini

Em **Credentials**, abra `feedback` / `Google Gemini(PaLM) Api account` e
confirme que a chave aparece preenchida. Se vier vazia ou der erro de
descriptografia, a `N8N_ENCRYPTION_KEY` do `.env` não bate com a do
`n8n_data/config` — corrija e reinicie o container.

### 8.3 Ativar os workflows

Este é o passo mais fácil de esquecer, e sem ele a aplicação inteira dá timeout.
Os três workflows estão **inativos** hoje:

| Workflow | ID | Caminho do webhook | O que fazer |
|---|---|---|---|
| Extração - STI | `QWtOTfTYuSUwDPh2` | `extracao-otimizado` | **Ativar** — é o que o `.env` aponta |
| Feedback | `k4c8eTmdip1OF4Jq` | `feedback-sti` | **Ativar** |
| Extração - STI (duplicado) | `rFkliKSCW6svJ98P` | `extracao` | Deixar inativo, ou renomear para não confundir |

Existem **duas** cópias do workflow de extração com nomes idênticos e caminhos
diferentes. A versão em uso é a `extracao-otimizado`. Vale renomear a outra para
`Extração - STI (antigo)` para ninguém ativar a errada por engano.

Depois de ativar, confirme o caminho de produção:

```bash
curl -i -X POST http://localhost:5678/webhook/feedback-sti -H 'Content-Type: application/json' -d '{}'
```

Qualquer resposta que não seja `404` significa que o webhook está registrado.

---

## 9. Teste ponta a ponta

Em `http://SEU_IP`, percorra o fluxo completo:

1. Aceitar o termo LGPD (role até o fim para liberar o botão).
2. Enviar uma imagem de `pesquisa/Questões de matemática do STI/` e a resposta correta.
3. Conferir a extração e revisá-la.
4. Preencher o questionário pedagógico e gerar o feedback.
5. Aprovar o feedback.

Com o DevTools aberto (F12 → Network), as chamadas devem ir para
`/api/submissions/...` — **caminhos relativos**, sem `localhost:3001`. Se você
vir `localhost:3001`, o build do frontend pegou o `VITE_API_BASE_URL` errado:
corrija o `.env` e refaça `up -d --build`.

Lembre que o backend guarda as submissões **em memória**. Reiniciar o container
`backend` no meio de um atendimento perde a submissão em andamento.

---

## 10. Atualizar a aplicação

Depois do primeiro deploy, publicar uma mudança é isto:

```bash
ssh deploy@SEU_IP
cd ~/sti-n8n
git pull
docker compose --env-file .env -f docker/docker-compose.prod.yml up -d --build
docker image prune -f          # limpa imagens antigas, evita encher o disco
```

Mudou só o `.env`? `docker compose ... up -d` basta — **exceto** para
`VITE_API_BASE_URL`, que é lido na hora do build e exige `--build`.

---

## 11. Fase 2 — domínio e HTTPS

Enquanto a aplicação roda em HTTP no IP, o tráfego (incluindo as imagens dos
alunos) trafega sem criptografia. Para um MVP em teste fechado, dá. Para uso com
professores de verdade, HTTPS deixa de ser opcional — inclusive pela LGPD.

**Como conseguir um domínio:**

- `.com.br` no [Registro.br](https://registro.br) — R$ 40/ano, o caminho normal.
- Um subdomínio institucional (`sti.ic.ufal.br`) pedido à TI da universidade —
  de graça, e mais adequado para um projeto de pesquisa.
- Sem domínio nenhum: serviços como `sslip.io` transformam o IP em nome
  (`143-198-0-0.sslip.io`) e o Let's Encrypt emite certificado para ele. Serve
  para demonstração; para produção, prefira um domínio de verdade.

**Passos:**

1. Aponte dois registros DNS `A` para o IP da Droplet:
   `sti.seudominio.com.br` e `n8n.seudominio.com.br`.
2. No `.env`, preencha `APP_DOMAIN`, `N8N_DOMAIN`, `ACME_EMAIL` e troque
   `FRONTEND_ORIGIN` para `https://sti.seudominio.com.br`.
3. Suba com o override do Caddy, que emite e renova os certificados sozinho:

```bash
docker compose --env-file .env \
               -f docker/docker-compose.prod.yml \
               -f docker/docker-compose.tls.yml up -d --build
```

4. No firewall da DigitalOcean, a porta 5678 pode ser **fechada** — o n8n passa a
   ser servido em `https://n8n.seudominio.com.br`.

---

## 12. Backup e manutenção

O que é insubstituível é o `n8n_data/` (workflows, credenciais, execuções). O
código está no GitHub e o `.env` você reconstrói — o `n8n_data` não.

```bash
mkdir -p ~/backups
cat > ~/backup-n8n.sh <<'EOF'
#!/bin/bash
cd ~/sti-n8n
tar -czf ~/backups/n8n_data-$(date +%F).tar.gz --exclude="*.log" n8n_data
find ~/backups -name 'n8n_data-*.tar.gz' -mtime +30 -delete
EOF
chmod +x ~/backup-n8n.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /home/deploy/backup-n8n.sh") | crontab -
```

Baixe uma cópia para fora da Droplet de vez em quando:
`scp deploy@SEU_IP:~/backups/n8n_data-*.tar.gz .`

Ligue também os **Backups** da própria DigitalOcean (+20% do valor da Droplet) —
eles cobrem o disco inteiro, não só o n8n.

---

## Troubleshooting

| Sintoma | Causa provável | Correção |
|---|---|---|
| Tela branca em `http://SEU_IP` | Build do frontend falhou | `docker compose --env-file .env -f docker/docker-compose.prod.yml logs frontend` |
| Chamadas indo para `localhost:3001` | `VITE_API_BASE_URL` errado no build | `VITE_API_BASE_URL=/` no `.env` e `up -d --build` |
| `413 Request Entity Too Large` no upload | `client_max_body_size` do nginx | Já está em 20 MB no `docker/nginx.conf`; se aumentar `UPLOAD_MAX_SIZE_MB`, aumente aqui também |
| `504` ou timeout na extração | Gemini demorou mais que o proxy aguenta | `proxy_read_timeout` no `nginx.conf` (180 s) e `N8N_TIMEOUT_MS` (120 s) |
| Backend responde `404 not registered for POST` | Workflow desativado no n8n | Ativar o workflow (seção 8.3) |
| n8n não sobe: "Mismatching encryption keys" | `N8N_ENCRYPTION_KEY` ≠ `n8n_data/config` | Copiar o valor exato do `config` para o `.env` |
| Login do n8n falha com erro de cookie | HTTPS ausente + cookie seguro | `N8N_SECURE_COOKIE=false` no `.env` |
| n8n reclama de permissão do `config` | Arquivo legível demais | `chmod 600 n8n_data/config` |
| n8n não enxerga os dados migrados | Dono errado do diretório | `sudo chown -R 1000:1000 n8n_data` |
| Disco cheio | Logs do n8n e imagens antigas | `docker image prune -af` e `docker system df` |
| Build morre com "killed" | Memória insuficiente | Confirmar o swap do passo 3.2 |

---

## Referência rápida de variáveis

| Variável | Dev (local) | Produção (Droplet) |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | `http://SEU_IP` |
| `VITE_API_BASE_URL` | `http://localhost:3001` | `/` |
| `N8N_EXTRACTION_WEBHOOK_URL` | `http://n8n:5678/webhook-test/extracao-otimizado` | `http://n8n:5678/webhook/extracao-otimizado` |
| `N8N_FEEDBACK_WEBHOOK_URL` | `http://n8n:5678/webhook-test/feedback-sti` | `http://n8n:5678/webhook/feedback-sti` |
| `N8N_HOST` / `WEBHOOK_URL` | `localhost` | IP ou domínio público |
| `N8N_SECURE_COOKIE` | — | `false` em HTTP, `true` em HTTPS |
| `N8N_IMAGE_TAG` | — | versão fixa, nunca `latest` |
