# Guia de Implantação: Blog Strapi/Next.js em VPS Ubuntu 22.04

Este guia assume que você tem acesso root ou sudo a uma VPS Ubuntu 22.04.
Substitua `yourdomain.com` e `api.yourdomain.com` pelos seus domínios reais.

## 1. Configuração Inicial do Servidor
- Atualize o sistema:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- Crie um usuário não-root com privilégios sudo (recomendado).
- Configure o firewall UFW para permitir OpenSSH, HTTP e HTTPS:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full' # Ou 'Nginx HTTP' e 'Nginx HTTPS' separadamente
  sudo ufw enable
  ```

## 2. Instalar Docker e Docker Compose
- Siga as instruções oficiais do Docker para instalar o Docker Engine:
  [https://docs.docker.com/engine/install/ubuntu/](https://docs.docker.com/engine/install/ubuntu/)
- Instale o Docker Compose Plugin (se estiver usando Docker Engine v20.10+):
  ```bash
  sudo apt install docker-compose-plugin -y 
  # Verifique: docker compose version
  ```
  Ou para versões mais antigas do Docker Compose (standalone):
  [https://docs.docker.com/compose/install/standalone/](https://docs.docker.com/compose/install/standalone/)

## 3. Clonar o Projeto
- Instale o Git:
  ```bash
  sudo apt install git -y
  ```
- Clone seu repositório do projeto para a VPS (ex: `/var/www/my-blog`):
  ```bash
  # Exemplo:
  # sudo git clone https://your-repo-url.com/project.git /var/www/my-blog
  # cd /var/www/my-blog
  ```
- Certifique-se que os arquivos `docker-compose.yml` (na raiz do projeto) e o código do `backend` e `frontend` estejam presentes.

## 4. Configurar Variáveis de Ambiente
- **Backend (Strapi):** O `docker-compose.yml` já deve referenciar as variáveis de ambiente para banco de dados, JWT secrets, etc. Em um ambiente de produção, é crucial que `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET` e as senhas do banco de dados sejam fortes e únicas. Você pode usar um arquivo `.env` na mesma pasta do `docker-compose.yml` se o seu `docker-compose.yml` estiver configurado para lê-lo, ou defini-las diretamente no `environment` do serviço Strapi.
  Exemplo de `.env` para Strapi (se o `docker-compose.yml` usar `env_file`):
  ```env
  DATABASE_CLIENT=mysql
  DATABASE_HOST=mysql_db
  DATABASE_PORT=3306
  DATABASE_NAME=strapi_db_prod # Considere um nome diferente para produção
  DATABASE_USERNAME=strapi_user_prod
  DATABASE_PASSWORD=your_strong_strapi_db_password
  JWT_SECRET=your_very_strong_jwt_secret
  ADMIN_JWT_SECRET=your_very_strong_admin_jwt_secret
  APP_KEYS=your_app_key1,your_app_key2,your_app_key3 # Gere chaves aleatórias
  NODE_ENV=production
  # Para uploads S3 (opcional):
  # AWS_ACCESS_KEY_ID=...
  # AWS_ACCESS_SECRET=...
  # AWS_REGION=...
  # AWS_BUCKET_NAME=...
  ```

- **Frontend (Next.js):**
  - Crie o arquivo `.env.local` (ou `.env.production`) na pasta `frontend`:
    ```
    NEXT_PUBLIC_STRAPI_API_URL=https://api.yourdomain.com/api
    NEXT_PUBLIC_SITE_URL=https://yourdomain.com
    # Outras variáveis de ambiente de produção se houver
    ```
  - **Importante:** Se você for construir a imagem Docker do frontend, essas variáveis de ambiente precisam estar disponíveis no momento do build ou serem configuradas para serem lidas em runtime se o Next.js estiver configurado para isso.

## 5. Construir e Rodar Aplicações com Docker Compose (Backend)
- Navegue até o diretório do seu projeto onde está o `docker-compose.yml`.
- Inicie os serviços Strapi e MySQL:
  ```bash
  cd /var/www/my-blog # Ou onde seu docker-compose.yml está
  docker compose up --build -d mysql_db strapi
  ```
  Isso irá construir as imagens (se houver um Dockerfile para o Strapi, caso contrário baixa a oficial) e iniciar os containers em background.
  O Strapi pode levar alguns minutos para iniciar pela primeira vez. Verifique os logs: `docker compose logs strapi`.

## 6. Construir e Rodar Aplicação Next.js
**Opção A: Servir com Node.js (dentro ou fora do Docker)**
- Se não for usar Docker para o Next.js:
  ```bash
  cd /var/www/my-blog/frontend
  npm install
  npm run build
  # Instalar PM2 globalmente se ainda não o fez
  # sudo npm install pm2 -g
  pm2 start npm --name "nextjs-frontend" -- run start -- -p 3000
  pm2 startup # Para fazer o PM2 iniciar com o sistema
  pm2 save
  ```
**Opção B: Servir com Docker (Recomendado para consistência)**
- Crie um `Dockerfile` na pasta `frontend`. Exemplo:
  ```dockerfile
  # frontend/Dockerfile
  FROM node:18-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  # Defina aqui as build-time environment variables se necessário
  # ARG NEXT_PUBLIC_STRAPI_API_URL
  # ENV NEXT_PUBLIC_STRAPI_API_URL=$NEXT_PUBLIC_STRAPI_API_URL
  RUN npm run build

  FROM node:18-alpine
  WORKDIR /app
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY --from=builder /app/package.json ./package.json
  COPY --from=builder /app/next.config.js ./next.config.js # Se existir
  # Copie node_modules se não estiverem sendo reconstruídos ou se forem necessários para 'next start'
  # COPY --from=builder /app/node_modules ./node_modules

  # Exponha a porta que o Next.js usa
  EXPOSE 3000
  # Comando para iniciar o servidor Next.js em produção
  CMD ["npm", "start", "-p", "3000"]
  ```
- Adicione o serviço Next.js ao `docker-compose.yml`:
  ```yaml
  # ... (serviços mysql_db e strapi) ...
  services:
    # ...
    frontend:
      build:
        context: ./frontend
        # args: # Para passar build arguments para o Dockerfile
        #   NEXT_PUBLIC_STRAPI_API_URL: ${NEXT_PUBLIC_STRAPI_API_URL_PROD} # Exemplo
      ports:
        - "3000:3000"
      environment: # Runtime environment variables
        NODE_ENV: production
        NEXT_PUBLIC_STRAPI_API_URL: ${NEXT_PUBLIC_STRAPI_API_URL_PROD} # Exemplo
        NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL_PROD} # Exemplo
      # depends_on: # Opcional, se o frontend precisar que o backend esteja pronto no build/start
      #   - strapi
      restart: unless-stopped
  ```
  *Nota: Você precisará definir `NEXT_PUBLIC_STRAPI_API_URL_PROD` e `NEXT_PUBLIC_SITE_URL_PROD` no seu ambiente ou em um arquivo `.env` que o `docker-compose` leia.*
- Inicie o serviço frontend com Docker Compose:
  ```bash
  cd /var/www/my-blog
  docker compose up --build -d frontend
  ```

## 7. Instalar e Configurar Nginx
- Instale o Nginx:
  ```bash
  sudo apt install nginx -y
  ```
- Crie o arquivo de configuração do site (ex: `/etc/nginx/sites-available/myblog`):
  Cole o conteúdo do `nginx_site.conf` gerado anteriormente (ajustando `server_name` para seus domínios reais).
  ```bash
  sudo nano /etc/nginx/sites-available/yourdomain.com
  ```
  (Cole o conteúdo do `nginx_site.conf` aqui)
- Crie um link simbólico para habilitar o site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
  ```
- Remova o link simbólico do site padrão se ele conflitar:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default 
   ```
- Teste a configuração do Nginx:
  ```bash
  sudo nginx -t
  ```
- Recarregue o Nginx se o teste for bem-sucedido:
  ```bash
  sudo systemctl reload nginx
  ```

## 8. Configurar SSL com Let's Encrypt
- Instale o Certbot:
  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  ```
- Obtenha e instale os certificados SSL (siga as instruções do Certbot):
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  sudo certbot --nginx -d api.yourdomain.com
  ```
  Certbot deve atualizar automaticamente sua configuração Nginx para HTTPS.
- Verifique a renovação automática:
  ```bash
  sudo systemctl status certbot.timer
  # Teste a renovação (dry run):
  # sudo certbot renew --dry-run
  ```

## 9. Configurar Backups (Ver `backup-script.sh`)
- Transfira o `backup-script.sh` para o servidor.
- Dê permissão de execução: `chmod +x backup-script.sh`.
- Configure um cronjob para rodar o script diariamente. Ex: `sudo crontab -e` e adicione:
  `0 2 * * * /caminho/para/seu/backup-script.sh`

## 10. Considerações Finais
- **Segurança do Strapi Admin:** Altere a senha do usuário admin padrão do Strapi imediatamente.
- **Monitoramento:** Considere configurar ferramentas de monitoramento para seus serviços.
- **Logs:** Verifique os logs regularmente:
  - Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
  - Docker: `docker compose logs strapi`, `docker compose logs frontend`
  - PM2 (se usado): `pm2 logs nextjs-frontend`

Este é um guia inicial. Adapte-o conforme as necessidades específicas do seu projeto.
```
