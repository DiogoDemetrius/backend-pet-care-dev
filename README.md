# Backend Express.js + MongoDB para React Native

Este projeto é um backend completo para um aplicativo React Native, construído com Express.js e MongoDB.

## Estrutura do Projeto

```
├── controllers/
│   └── user.controller.js
├── middlewares/
│   └── auth.middleware.js
├── models/
│   └── User.js
├── routes/
│   └── user.routes.js
├── services/
│   └── user.service.js
├── app.js
├── server.js
├── .env
└── package.json
```

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/appReactNative
JWT_SECRET=sua_chave_secreta_muito_segura
NODE_ENV=development
```

## Dependências

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.1",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.6.1",
    "morgan": "^1.10.0"
  }
}
```

## Execução

```bash
npm start
```

## API Endpoints

### Usuários

#### Endpoints Públicos

- `POST /api/users` - Registrar um novo usuário
- `POST /api/users/login` - Autenticar usuário
- `POST /api/users/forgot-password` - Solicitar redefinição de senha
- `POST /api/users/reset-password` - Redefinir senha com token

#### Endpoints Protegidos

- `GET /api/users` - Listar todos os usuários (admin)
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Remover usuário (admin)
- `PATCH /api/users/:id/deactivate` - Desativar conta de usuário
- `PATCH /api/users/:id/activate` - Reativar conta de usuário (admin)
- `POST /api/users/change-password` - Alterar senha

## Autenticação

A API utiliza autenticação JWT (JSON Web Token). Para acessar endpoints protegidos, inclua o token no header da requisição:

```
Authorization: Bearer <seu_token_jwt>
```

## Exemplo de uso - Registro de usuário

```javascript
// Exemplo com fetch
fetch('http://localhost:5000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'usuario',
    email: 'usuario@exemplo.com',
    password: 'senha123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
```