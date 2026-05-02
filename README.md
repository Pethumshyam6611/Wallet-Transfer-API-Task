# Wallet Transfer API

A professional Node.js/Express backend API for user authentication and atomic wallet transfers using MongoDB, Mongoose transactions, JWT, and bcrypt.

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Bcrypt password hashing

## Project Structure

```text
.
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   └── walletController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   ├── Transaction.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   └── walletRoutes.js
├── .env.example
├── package.json
├── README.md
└── server.js
```

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example:

```bash
cp .env.example .env
```

3. Update `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/wallet_transfer_api
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

4. Start MongoDB.

Mongoose transactions require MongoDB replica set support. For local development, use a local replica set or MongoDB Atlas. A standalone local MongoDB server does not support transactions.

5. Run the server:

```bash
npm run dev
```

For production-style execution:

```bash
npm start
```

## Base URL

```text
http://localhost:5000
```

## Authentication

Protected endpoints require a Bearer token:

```http
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "success": true,
  "message": "API is running"
}
```

### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "Alice Doe",
  "email": "alice@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Alice Doe",
    "email": "alice@example.com",
    "balance": 1000,
    "createdAt": "2026-05-02T00:00:00.000Z"
  }
}
```

### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "Alice Doe",
    "email": "alice@example.com",
    "balance": 1000,
    "createdAt": "2026-05-02T00:00:00.000Z"
  }
}
```

### Get Current User Profile

```http
GET /api/user/profile
```

Protected: Yes

Success response:

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "Alice Doe",
    "email": "alice@example.com",
    "balance": 1000,
    "createdAt": "2026-05-02T00:00:00.000Z"
  }
}
```

### Transfer Balance

```http
POST /api/wallet/transfer
```

Protected: Yes

Request body:

```json
{
  "receiverId": "receiver_user_id",
  "amount": 100
}
```

Success response:

```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "transaction": {
    "senderId": "sender_user_id",
    "receiverId": "receiver_user_id",
    "amount": 100,
    "timestamp": "2026-05-02T00:00:00.000Z",
    "_id": "transaction_id",
    "createdAt": "2026-05-02T00:00:00.000Z",
    "updatedAt": "2026-05-02T00:00:00.000Z"
  },
  "balance": 900
}
```

## Transfer Safety Guarantees

The transfer endpoint uses:

- Mongoose sessions and transactions so debit, credit, and transaction logging commit or roll back together.
- Atomic `$inc` updates to prevent lost updates under concurrent transfer requests.
- Conditional sender update with `balance: { $gte: amount }` to prevent negative balances.
- Validations for receiver existence, sufficient balance, positive amount, and self-transfer prevention.

## Common Error Responses

```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

```json
{
  "success": false,
  "message": "Insufficient balance"
}
```

```json
{
  "success": false,
  "message": "Receiver does not exist"
}
```
