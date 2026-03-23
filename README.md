# Security Testing Demo Backend

A simple Node.js + Express backend with SQLite for user registration and login. Designed for security testing and CodeQL scanning.

## Features
- User registration and login via REST API
- Users stored in local SQLite database
- Clean base code (no vulnerabilities in main branch)

## Tech Stack
- Node.js
- Express
- SQLite (via sqlite3)

## Project Structure
```
/backend
  app.js
  db.js
  package.json
  .gitignore
  /routes
    userRoutes.js
  /controllers
    userController.js
/.github/workflows/codeql.yml
README.md
```

## Setup & Run
1. Install dependencies:
   ```sh
   cd backend
   npm install
   ```
2. Start the server:
   ```sh
   node app.js
   ```
3. API endpoints:
   - `POST /api/users/register` — Register a new user
   - `POST /api/users/login` — Login
   - `GET /api/echo?message=<value>` — Reflects the provided message back in the response (intentionally vulnerable to XSS for demo)

## CodeQL Scanning
- CodeQL workflow is in `.github/workflows/codeql.yml`
- Runs on every pull request to `main`

## Creating Vulnerability Branches

To test security tools, create the following branches and introduce the specified vulnerabilities. Use the provided titles and descriptions to create GitHub issues for each branch:

### 1. SQL Injection
**Issue Title:** SQL Injection Vulnerability in User Authentication
**Description:**
Introduce a SQL injection vulnerability by modifying the user authentication or registration logic to use unsanitized user input directly in SQL queries. For example, construct SQL statements by concatenating user-provided values without using parameterized queries. This will allow attackers to manipulate the SQL query and potentially access or modify unauthorized data.
**Branch:** `vuln/sql-injection`

### 2. Hardcoded Secret
**Issue Title:** Hardcoded Secret in Source Code
**Description:**
Add a hardcoded secret (such as an API key, password, or cryptographic key) directly in the source code. This demonstrates the risk of exposing sensitive information in code repositories, which can be exploited if the code is leaked or shared.
**Branch:** `vuln/hardcoded-secret`

### 3. XSS Vulnerability
**Issue Title:** Cross-Site Scripting (XSS) Vulnerability
**Description:**
Add an endpoint that reflects user input in the response without proper sanitization or encoding. This allows attackers to inject malicious scripts that could be executed in the context of a user's browser, leading to potential data theft or session hijacking.
**Branch:** `vuln/xss`

### 4. Insecure Deserialization
**Issue Title:** Insecure Deserialization of User Input
**Description:**
Add code that deserializes user-provided input without validation or type checking. This can allow attackers to craft malicious payloads that, when deserialized, could execute arbitrary code or alter application logic.
**Branch:** `vuln/insecure-deserialization`

### 5. Command Injection
**Issue Title:** Command Injection via Unsanitized Input
**Description:**
Add code that executes shell commands using user input without proper sanitization or validation. This can allow attackers to execute arbitrary commands on the server, potentially compromising the system.
**Branch:** `vuln/command-injection`

**For each branch:**
- Create from `main`.
- Add the vulnerability as described.
- Open a pull request to `main` to trigger CodeQL scan.

## .gitignore
- `node_modules/`, `users.db`, and `.env` are ignored.

---

**Note:** This project is for educational/demo purposes only. Do NOT use in production.
