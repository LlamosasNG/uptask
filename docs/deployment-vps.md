# Despliegue de UpTask en una VPS

Esta guía despliega una versión validada de `main` en una VPS Ubuntu 24.04 LTS. Nginx del host termina TLS y envía `/api/*` a Express y el resto a la web estática; ambos contenedores solo publican puertos en `127.0.0.1`. MongoDB vive en Atlas, no en Docker ni en la VPS.

## 1. Preparar la versión y la infraestructura

1. Integra la rama de mejoras en `main` mediante una revisión y exige que pasen los jobs `verify` y `containers` de CI. Despliega un commit concreto de `main`, nunca un árbol con cambios locales. No es necesario instalar Node.js ni pnpm en la VPS: las imágenes usan Node 24.21.0 y pnpm 12.5.1 durante la construcción.
2. Provisiona una VPS Ubuntu 24.04 LTS con IP pública fija; 2 vCPU y 4 GB de RAM son el punto de partida, no una garantía de capacidad. Crea un usuario administrador sin acceso SSH por contraseña, habilita actualizaciones de seguridad y prepara el firewall. Permite SSH solo desde tu IP administrativa y abre TCP 80/443. **Verifica una segunda sesión SSH antes de habilitar el firewall**, para no perder el acceso. Instala Docker Engine y el plugin Compose desde la [guía oficial para Ubuntu](https://docs.docker.com/engine/install/ubuntu/), además de `nginx` y `certbot` desde los repositorios de Ubuntu. El usuario de despliegue puede ejecutar los comandos Docker con `sudo`; no necesita pertenecer al grupo `docker`.
3. Crea un cluster dedicado Atlas M10 y habilita Cloud Backup. Configura, como política inicial, snapshots diarios durante 7 días y semanales durante 4 semanas. Crea un usuario de base de datos exclusivo con acceso `readWrite` solo a la base `uptask`; añade a la lista de acceso la IP de la VPS como `/32`, nunca `0.0.0.0/0`. Conserva la cadena `mongodb+srv://...` con el nombre de base `uptask`; codifica cualquier carácter especial de usuario o contraseña en la URI. Comprueba los costes de M10 y backups antes de contratarlo. [Seguridad de Atlas](https://www.mongodb.com/docs/atlas/architecture/current/network-security/) y [opciones de backup](https://www.mongodb.com/docs/atlas/cluster-additional-settings/).
4. Prepara una cuenta SMTP autenticada y verifica que la VPS puede salir por el puerto elegido (habitualmente 587). Crea en Cloudflare un registro `A` del subdominio a la IP de la VPS y déjalo temporalmente en modo **DNS only** para obtener el primer certificado.

## 2. Configurar secretos e iniciar los contenedores

Clona el repositorio en la VPS, cambia a un commit ya integrado en `main` y comprueba que `git status --porcelain` no muestra cambios. En los ejemplos, sustituye `app.example.com` por el subdominio real.

```bash
git switch main
git pull --ff-only
git status --porcelain
release_tag=$(git rev-parse --short=12 HEAD)
```

Crea `/etc/uptask/server.env` como archivo propiedad de root con permisos `0600`, siguiendo [`deploy/server.env.example`](../deploy/server.env.example). Usa valores reales para `DATABASE_URL`, `JWT_SECRET` (aleatorio y largo), `FRONTEND_URL=https://app.example.com` y SMTP; no copies los marcadores de ejemplo a producción. No coloques secretos en `.env` del repositorio ni en argumentos de construcción de Docker. El frontend se construye con `VITE_API_URL=/api`, por lo que usa el mismo origen que la web.

```bash
sudo install -d -m 700 /etc/uptask
sudo test -e /etc/uptask/server.env || sudo install -m 600 /dev/null /etc/uptask/server.env
sudoedit /etc/uptask/server.env
sudo env UPTASK_IMAGE_TAG="$release_tag" UPTASK_ENV_FILE=/etc/uptask/server.env \
  docker compose -f compose.production.yaml config --quiet
sudo env UPTASK_IMAGE_TAG="$release_tag" UPTASK_ENV_FILE=/etc/uptask/server.env \
  docker compose -f compose.production.yaml up -d --build --wait --wait-timeout 120
```

Las imágenes llevan la etiqueta del commit para poder revertirlas; no ejecutes `docker image prune` sobre las versiones que necesites conservar. Comprueba que la API está lista y que la web responde localmente:

```bash
curl --fail http://127.0.0.1:8000/ready
curl --fail --head http://127.0.0.1:3000/
```

`/health` indica que el proceso responde, mientras `/ready` exige que MongoDB acepte un `ping`. Si `/ready` devuelve 503, revisa los logs, la URI, la lista de acceso de Atlas y la conectividad DNS/salida de la VPS. Los logs están limitados a tres archivos de 10 MB por contenedor.

## 3. Nginx, Certbot y Cloudflare

Crea `/var/www/letsencrypt`, instala [`bootstrap.conf`](../deploy/nginx/bootstrap.conf) como sitio de Nginx y sustituye `__UPTASK_DOMAIN__` por el subdominio real. Activa el sitio, valida con `sudo nginx -t` y recarga Nginx. El bootstrap sirve el desafío HTTP-01 y envía la web por HTTP mientras se emite el certificado. Certbot usa **webroot** para renovar sin detener Nginx:

```bash
sudo install -d -m 755 /var/www/letsencrypt
sudo install -m 644 deploy/nginx/bootstrap.conf /etc/nginx/sites-available/uptask
sudo sed -i 's/__UPTASK_DOMAIN__/app.example.com/g' /etc/nginx/sites-available/uptask
sudo ln -s /etc/nginx/sites-available/uptask /etc/nginx/sites-enabled/uptask
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/letsencrypt -d app.example.com
```

Instala ahora [`uptask.conf`](../deploy/nginx/uptask.conf) en el mismo sitio, sustituye de nuevo el dominio y valida antes de recargar. Este archivo conserva el prefijo `/api` al reenviar a Express; **no añadas una barra final a `proxy_pass`** en el bloque `/api/`. Deja `/ready` accesible solo por `127.0.0.1:8000` y publica `/health` para vigilancia externa.

```bash
sudo install -m 644 deploy/nginx/uptask.conf /etc/nginx/sites-available/uptask
sudo sed -i 's/__UPTASK_DOMAIN__/app.example.com/g' /etc/nginx/sites-available/uptask
sudo nginx -t
sudo systemctl reload nginx
sudo install -m 755 deploy/nginx/reload-after-renewal.sh \
  /etc/letsencrypt/renewal-hooks/deploy/uptask-reload-nginx.sh
sudo certbot renew --dry-run
```

Confirma primero que `https://app.example.com/health` presenta un certificado válido directamente en el origen. Después activa el proxy de Cloudflare y el modo TLS **Full (strict)**; este modo verifica el certificado presentado por la VPS. Mantén disponible el desafío `/.well-known/acme-challenge/` tanto en HTTP como en HTTPS para la renovación. [Certbot con webroot](https://certbot.eff.org/instructions?os=snap&ws=nginx) y [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

## 4. Validación, operación y reversión

Tras activar Cloudflare, comprueba desde fuera de la VPS:

- `https://app.example.com/` y una ruta profunda de React cargan sin 404; el navegador envía las llamadas a `https://app.example.com/api/...`.
- `https://app.example.com/health` devuelve `{ "status": "ok" }`; el puerto 8000 no es accesible desde Internet.
- Registro, confirmación por correo, inicio de sesión, creación de proyecto y una operación de tareas funcionan con Atlas y SMTP reales. Usa cuentas de prueba; elimina esos datos al terminar.
- El certificado no está próximo a caducar, `certbot renew --dry-run` funciona y el temporizador de Certbot está activo. Vigila uso de CPU, RAM y disco, caídas de contenedores, respuestas 5xx y alertas de Atlas.

Para diagnosticar, consulta los logs del servicio `api` (o sustituye `api` por `web`):

```bash
sudo env UPTASK_IMAGE_TAG="$(git rev-parse --short=12 HEAD)" UPTASK_ENV_FILE=/etc/uptask/server.env \
  docker compose -f compose.production.yaml logs --tail=100 api
```

Evita imprimir el contenido de `server.env` en logs o tickets. Prueba una restauración de un snapshot de Atlas en **otro cluster/base aislada** y verifica los datos antes de considerar los backups operativos.

Para revertir, cambia el checkout de la VPS al commit anterior conocido y reutiliza sus imágenes conservadas:

```bash
git switch --detach <commit-anterior>
release_tag=$(git rev-parse --short=12 HEAD)
sudo env UPTASK_IMAGE_TAG="$release_tag" UPTASK_ENV_FILE=/etc/uptask/server.env \
  docker compose -f compose.production.yaml up -d --no-build --wait --wait-timeout 120
```

Comprueba `/ready`, `/health` y los flujos esenciales. La reversión cambia las imágenes, **no** revierte datos de Atlas; antes de introducir migraciones de datos en versiones futuras habrá que definir su compatibilidad hacia atrás.
