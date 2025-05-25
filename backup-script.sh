#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# --- Configurações ---
MYSQL_USER="strapi_user"
# MYSQL_PASSWORD="strapipassword" # Evite senhas no script. Use ~/.my.cnf
MYSQL_DATABASE="strapi_db"
MYSQL_HOST="localhost" # Ou o nome do container Docker do MySQL se este script rodar no host

# Caminho para o volume de uploads do Strapi no host Docker
# Se o docker-compose.yml tem: volumes: - strapi_uploads:/srv/app/public/uploads
# E 'strapi_uploads' é um volume nomeado gerenciado pelo Docker, você precisará
# descobrir o caminho real desse volume no host (docker volume inspect strapi_uploads)
# ou montar um bind mount para um caminho conhecido.
# Exemplo se você usou um bind mount para ./strapi_data/uploads:/srv/app/public/uploads no docker-compose
# STRAPI_UPLOADS_DIR="/var/www/my-blog/strapi_data/uploads"
# Para este exemplo, vamos assumir que o volume strapi_uploads do docker-compose.yml
# está mapeado para /var/docker_volumes/strapi_next_blog/strapi_uploads no host.
# O usuário precisará ajustar este caminho!
STRAPI_UPLOADS_DIR="/var/docker_volumes/strapi_next_blog/strapi_uploads" # AJUSTE CONFORME SUA CONFIGURAÇÃO DE VOLUME DOCKER

BACKUP_DIR="/opt/backups/strapi_blog" # Crie este diretório: sudo mkdir -p /opt/backups/strapi_blog && sudo chown youruser:yourgroup /opt/backups/strapi_blog
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

DB_BACKUP_FILENAME="strapi_db_backup_${TIMESTAMP}.sql.gz"
UPLOADS_BACKUP_FILENAME="strapi_uploads_backup_${TIMESTAMP}.tar.gz"

# --- Verificações ---
if [ ! -d "$STRAPI_UPLOADS_DIR" ]; then
  echo "Erro: Diretório de uploads do Strapi ($STRAPI_UPLOADS_DIR) não encontrado."
  echo "Verifique a variável STRAPI_UPLOADS_DIR no script."
  exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Criando diretório de backup: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
fi

echo "--- Iniciando Backup do Blog Strapi ---"
echo "Timestamp: $TIMESTAMP"

# --- Backup do Banco de Dados MySQL ---
echo "Fazendo backup do banco de dados MySQL ($MYSQL_DATABASE)..."
# Para usar ~/.my.cnf, crie o arquivo com o seguinte conteúdo e permissões (chmod 600 ~/.my.cnf):
# [mysqldump]
# user=strapi_user
# password=strapipassword
# host=localhost_or_mysql_container_name
#
# Se o MySQL estiver em um container Docker chamado 'mysql_db' (como no docker-compose.yml):
# Você pode executar mysqldump de dentro de outro container que tenha mysql-client
# ou usar 'docker exec':
# docker exec mysql_container_name mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" | gzip > "${BACKUP_DIR}/${DB_BACKUP_FILENAME}"
#
# Se o script roda no host e o MySQL expõe a porta 3306 para o host:
mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE" | gzip > "${BACKUP_DIR}/${DB_BACKUP_FILENAME}"
# Se estiver usando .my.cnf (recomendado), o comando seria mais simples:
# mysqldump --defaults-extra-file=~/.my.cnf "$MYSQL_DATABASE" | gzip > "${BACKUP_DIR}/${DB_BACKUP_FILENAME}"

if [ $? -eq 0 ]; then
  echo "Backup do banco de dados salvo em: ${BACKUP_DIR}/${DB_BACKUP_FILENAME}"
else
  echo "Erro ao fazer backup do banco de dados!"
  # Considerar remover o arquivo de backup parcial se houver erro
  rm -f "${BACKUP_DIR}/${DB_BACKUP_FILENAME}"
  exit 1
fi

# --- Backup dos Arquivos de Upload do Strapi ---
echo "Fazendo backup dos arquivos de upload do Strapi ($STRAPI_UPLOADS_DIR)..."
tar -czf "${BACKUP_DIR}/${UPLOADS_BACKUP_FILENAME}" -C "$(dirname "$STRAPI_UPLOADS_DIR")" "$(basename "$STRAPI_UPLOADS_DIR")"
# A opção -C muda o diretório para o pai de STRAPI_UPLOADS_DIR,
# e então arquiva apenas o diretório base de STRAPI_UPLOADS_DIR.
# Isso evita que a estrutura completa de diretórios desde a raiz seja incluída no tar.

if [ $? -eq 0 ]; then
  echo "Backup dos uploads salvo em: ${BACKUP_DIR}/${UPLOADS_BACKUP_FILENAME}"
else
  echo "Erro ao fazer backup dos arquivos de upload!"
  # Considerar remover o arquivo de backup parcial
  rm -f "${BACKUP_DIR}/${UPLOADS_BACKUP_FILENAME}"
  exit 1
fi

# --- Limpeza de Backups Antigos (Exemplo: remover backups com mais de 7 dias) ---
# echo "Removendo backups com mais de 7 dias..."
# find "${BACKUP_DIR}" -name "strapi_db_backup_*.sql.gz" -mtime +7 -exec rm {} \;
# find "${BACKUP_DIR}" -name "strapi_uploads_backup_*.tar.gz" -mtime +7 -exec rm {} \;
# echo "Limpeza concluída."

# --- Envio para Destino Remoto (Exemplo: AWS S3) ---
# Certifique-se de que o AWS CLI está instalado e configurado (aws configure)
#
# S3_BUCKET="seu-bucket-de-backup-strapi"
#
# echo "Enviando backup do banco de dados para o S3..."
# aws s3 cp "${BACKUP_DIR}/${DB_BACKUP_FILENAME}" "s3://${S3_BUCKET}/database_backups/${DB_BACKUP_FILENAME}"
#
# echo "Enviando backup dos uploads para o S3..."
# aws s3 cp "${BACKUP_DIR}/${UPLOADS_BACKUP_FILENAME}" "s3://${S3_BUCKET}/strapi_uploads_backups/${UPLOADS_BACKUP_FILENAME}"
#
# if [ $? -eq 0 ]; then
#   echo "Backups enviados para o S3 com sucesso."
# else
#   echo "Erro ao enviar backups para o S3!"
# fi

echo "--- Backup Concluído ---"
exit 0
