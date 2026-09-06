# UpTask - Administrador de Proyectos (Stack MERN)

<div align="center">
  <img src="https://raw.githubusercontent.com/llamosasng/uptask/main/client/public/logo.svg" alt="UpTask Logo" width="150"/> 
  
</div>

<p align="justify">
  UpTask es una aplicación web full-stack diseñada para la gestión eficiente de proyectos y tareas. Permite a los usuarios registrarse, crear proyectos, asignar tareas y colaborar con otros miembros del equipo en un entorno intuitivo y moderno.
</p>

---

## ✨ Características Principales

- 🔐 **Autenticación Completa:** Sistema de registro, confirmación de cuenta por email, inicio de sesión y recuperación de contraseña.
- 📂 **Gestión de Proyectos:** Crea, edita, visualiza y elimina proyectos de forma sencilla.
- 📋 **Gestión de Tareas:** Añade, actualiza y elimina tareas dentro de cada proyecto, y gestiona su estado (`Pendiente`, `En Progreso`, `Completada`, etc.).
- 👥 **Colaboración en Equipo:** Busca y añade miembros a un proyecto por su email para una gestión colaborativa.
- 🛡️ **Roles y Permisos:** Sistema de autorización que distingue entre el **Manager** del proyecto (con control total) y los **Colaboradores**.

---

## 💻 Tecnologías Utilizadas

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white" alt="React Query">
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT">
</div>

La aplicación está construida con el stack **MERN (MongoDB, Express, React, Node.js)** y utiliza tecnologías modernas tanto en el frontend como en el backend.

| Área         | Tecnología                                | Propósito                                                  |
| :----------- | :---------------------------------------- | :--------------------------------------------------------- |
| **Frontend** | **React con TypeScript**                  | Framework principal para la interfaz de usuario.           |
|              | **Vite**                                  | Herramienta de construcción y desarrollo ultrarrápida.     |
|              | **Tailwind CSS**                          | Diseño moderno y responsivo con utility-first.             |
|              | **React Query (`@tanstack/react-query`)** | Gestión del estado del servidor, caching y sincronización. |
|              | **React Router (`react-router-dom`)**     | Navegación y enrutamiento en la aplicación.                |
|              | **Headless UI & Chakra UI**               | Componentes de UI accesibles y personalizables.            |
|              | **React Toastify**                        | Notificaciones y alertas para el usuario.                  |
|              | **React Hook Form**                       | Gestión de formularios eficiente y con validaciones.       |
| **Backend**  | **Node.js con Express**                   | Entorno y framework para construir la API REST.            |
|              | **MongoDB & Mongoose**                    | Base de datos NoSQL y ODM para modelar los datos.          |
|              | **JSON Web Tokens (JWT)**                 | Autenticación segura y gestión de sesiones.                |
|              | **Nodemailer**                            | Envío de correos para confirmación y recuperación.         |
|              | **Express Validator**                     | Validación de los datos de entrada en las rutas de la API. |
|              | **CORS & Morgan**                         | Middleware para seguridad y logging de peticiones.         |

---

## 🚀 Cómo Empezar

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

- Node.js 22 (LTS)
- pnpm 10.26.2 (puedes habilitarlo con Corepack)
- MongoDB (local o una instancia en la nube como MongoDB Atlas)

### Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/llamosasng/uptask.git
   cd uptask
   ```

2. **Instala las dependencias del Backend:**

   ```bash
   corepack enable
   cd server
   pnpm install --frozen-lockfile
   ```

3. **Instala las dependencias del Frontend:**

   ```bash
   # Desde la carpeta raíz 'uptask'
   cd client
   pnpm install --frozen-lockfile
   ```

### Variables de Entorno

Es necesario crear archivos `.env` tanto para el cliente como para el servidor. Copia las plantillas incluidas y reemplaza únicamente los valores de ejemplo:

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

**Frontend (`/client/.env.local`):**

```env
VITE_API_URL=http://localhost:8000/api
```

**Backend (`/server/.env`):**

```env
DATABASE_URL=<TU_URL_DE_CONEXION_MONGODB>
FRONTEND_URL=http://localhost:5173
JWT_SECRET=<TU_PALABRA_SECRETA_PARA_JWT>

# Configuración de Nodemailer (ej. Mailtrap, Gmail)
SMTP_HOST=<TU_HOST_SMTP>
SMTP_PORT=<TU_PUERTO_SMTP>
SMTP_USER=<TU_USUARIO_SMTP>
SMTP_PASS=<TU_PASSWORD_SMTP>
```

`DATABASE_URL` y `JWT_SECRET` son obligatorias en todos los entornos. En producción también se exige `FRONTEND_URL`. El servidor termina durante el arranque si falta alguna variable obligatoria; nunca uses los valores de ejemplo como secretos reales.

---

## 📜 Scripts Disponibles

**Frontend (`/client`):**

- `pnpm dev`: Inicia el servidor de desarrollo de Vite.
- `pnpm test`: Ejecuta las pruebas con Vitest.
- `pnpm lint`: Ejecuta ESLint para analizar el código.
- `pnpm build`: Verifica TypeScript y compila la aplicación para producción.

**Backend (`/server`):**

- `pnpm dev`: Inicia el servidor de desarrollo con nodemon y ts-node.
- `pnpm dev:api`: Inicia el servidor aceptando clientes API sin origen de navegador.
- `pnpm test`: Ejecuta las pruebas de integración con Vitest y MongoDB en memoria.
- `pnpm build`: Verifica y compila TypeScript.

### Operación y verificación

El endpoint público `GET /health` devuelve `200` con `{ "status": "ok" }` para comprobaciones de liveness. No consulta MongoDB ni expone configuración.

Las peticiones se registran como JSON estructurado con fecha, método, ruta sin parámetros de consulta, estado y duración. Los logs no incluyen cuerpos, credenciales ni tokens y se desactivan durante las pruebas.

El workflow de GitHub Actions en `.github/workflows/ci.yml` instala con los lockfiles congelados y ejecuta pruebas y builds del servidor, además de pruebas, lint y build del cliente. Para reproducirlo localmente:

```bash
(cd server && pnpm install --frozen-lockfile && pnpm test && pnpm build)
(cd client && pnpm install --frozen-lockfile && pnpm test && pnpm lint && pnpm build)
```

---

## ✍️ Autor

_Noe Ramses Gonzalez Llamosas - <a href='https://github.com/LlamosasNG'>LlamosasNG</a>_
