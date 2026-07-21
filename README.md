# 🚦 Digital Lanka — Institutional Provisioning System

> **Module 6 — Traffic Portal User Management System**
> A full-stack web application for provisioning and managing institutional users (Super Admin, Admin, Officer) in a Sri Lankan government traffic management context.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Application Flow](#-application-flow)
5. [Backend Deep-Dive](#-backend-deep-dive)
   - [Config Layer](#1-config-layer)
   - [Entity Layer](#2-entity-layer)
   - [DTO Layer](#3-dto-layer)
   - [Repository Layer](#4-repository-layer)
   - [Security Layer](#5-security-layer)
   - [Service Layer](#6-service-layer)
   - [Controller Layer](#7-controller-layer)
   - [Exception Handling](#8-exception-handling)
   - [Data Seeder](#9-data-seeder)
6. [Frontend Deep-Dive](#-frontend-deep-dive)
7. [How Frontend and Backend Connect](#-how-frontend-and-backend-connect)
8. [API Reference](#-api-reference)
9. [Installation — Backend](#-installation--backend)
10. [Installation — Frontend](#-installation--frontend)
11. [Default Login Credentials](#-default-login-credentials)
12. [Project Structure](#-project-structure)

---

## 🌐 Project Overview

The **Institutional Provisioning System** is a secure, role-based user management portal. It allows a **Super Admin** to:

- Create, read, update, and delete system users
- Assign roles: `SUPER_ADMIN`, `ADMIN`, `OFFICER`, `USER`
- Manage role-specific attributes (department for Admins; batch number, rank, and police station for Officers)

All access is protected by **JWT (JSON Web Token)** authentication and **Spring Security role-based authorization**.

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Core language |
| Spring Boot | 3.3.1 | Application framework |
| Spring Security | (via Boot) | Authentication and Authorization |
| Spring Data JPA | (via Boot) | Database ORM |
| Spring Validation | (via Boot) | Request validation |
| JJWT (io.jsonwebtoken) | 0.11.5 | JWT token generation and parsing |
| MySQL | 8.x | Primary database |
| H2 Database | (runtime) | Optional in-memory database for dev |
| PostgreSQL | (runtime) | Optional PostgreSQL support |
| Maven | (mvnw) | Build tool |
| BCrypt | (via Spring Security) | Password hashing |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.3.1 | Build tool and dev server |
| React Router DOM | 6.23.1 | Client-side routing |
| Axios | 1.7.2 | HTTP client for API calls |
| Lucide React | 0.395.0 | Icon library |
| Vanilla CSS | — | Styling |

---

## 🏗 System Architecture

```
+---------------------------------------------+
|         FRONTEND (React + Vite)              |
|              Port: 5173                      |
|                                              |
|  +----------+  +----------------+  +------+ |
|  |  Login   |  |  Super Admin   |  | Admin| |
|  |  Page    |  |  Dashboard     |  | Page | |
|  +----------+  +----------------+  +------+ |
|        |               |                    |
|        +---------------+--------------------+
|                        | Axios + Vite Proxy  |
+------------------------+--------------------+
                         | /api/*
                         v
+---------------------------------------------+
|         BACKEND (Spring Boot)                |
|              Port: 8089                      |
|                                              |
|  +----------------------------------------+ |
|  |        Security Filter Chain           | |
|  |  CORS > JwtAuthFilter > Controllers   | |
|  +----------------------------------------+ |
|                                              |
|  +--------------+   +-------------------+   |
|  | AuthController|   |UserMgmtController |   |
|  | POST /login  |   | CRUD /admin/users |   |
|  +------+-------+   +--------+----------+   |
|         |                    |              |
|  +------v--------------------v----------+   |
|  |          Service Layer               |   |
|  |  AuthServiceImpl  UserMgmtSvcImpl   |   |
|  +----------------------+--------------+   |
|                         |                  |
|  +----------------------v--------------+   |
|  |        Repository Layer              |   |
|  |        UserRepository (JPA)          |   |
|  +----------------------+--------------+   |
|                         |                  |
+-------------------------+-------------------+
                          |
                          v
              +----------------------+
              |   MySQL Database     |
              |   trafficdb.users    |
              +----------------------+
```

---

## 🔄 Application Flow

### 1. User Login Flow

```
User enters email + password
        |
        v
[Frontend: AuthContext.login()]
        |
        |  POST /api/auth/login
        |  { email, password }
        v
[Backend: AuthController -> AuthServiceImpl]
        |
        +-- AuthenticationManager.authenticate()
        |       +-- CustomUserDetailsService.loadUserByUsername()
        |               +-- UserRepository.findByEmail()
        |
        +-- [If valid] JwtUtil.generateToken(userId, email, role, fullName)
        |       +-- JWT contains: id, role, fullName as claims
        |
        +-- Returns LoginResponseDto { token, id, email, fullName, role }
        |
        v
[Frontend: stores token and user info in AuthContext state]
        |
        +-- axios.defaults.headers['Authorization'] = 'Bearer <token>'
        |
        +-- React Router redirects to role-specific dashboard:
               SUPER_ADMIN -> /super-admin
               ADMIN       -> /admin
               OFFICER     -> /officer
```

### 2. Protected API Request Flow

```
Frontend makes authenticated request (e.g., GET /api/admin/users)
        |
        v
[Vite Dev Proxy] -> forwards to http://localhost:8089/api/admin/users
        |
        v
[JwtAuthFilter.doFilterInternal()]
        |
        +-- Extract "Authorization: Bearer <token>" header
        +-- JwtUtil.extractEmail(token)
        +-- CustomUserDetailsService.loadUserByUsername(email)
        +-- JwtUtil.validateToken(token, userDetails)
        +-- Set authentication in SecurityContextHolder
        |
        v
[Spring Security checks role]
        |
        +-- Route /api/admin/** requires ROLE_SUPER_ADMIN
        +-- @PreAuthorize("hasRole('SUPER_ADMIN')") on controller
        |
        v
[Controller -> Service -> Repository -> Database]
        |
        v
Returns JSON response to Frontend
```

### 3. Route Protection Flow (Frontend)

```
User navigates to /super-admin
        |
        v
[React Router: ProtectedRoute component]
        |
        +-- authState.isAuthenticated? No -> redirect to /login
        |
        +-- allowedRoles includes authState.role? No -> redirect to /unauthorized
        |
        +-- Yes -> render <SuperAdminDashboard />
```

---

## 🔧 Backend Deep-Dive

### Package Structure

```
src/main/java/com/digitallanka/institutionalprovisioning/
+-- InstitutionalProvisioningApplication.java   <- Entry point
+-- config/
|   +-- CorsConfig.java
|   +-- JwtConfig.java
|   +-- SecurityConfig.java
+-- controller/
|   +-- AuthController.java
|   +-- UserManagementController.java
+-- dto/
|   +-- AssignRoleRequestDto.java
|   +-- CreateUserRequestDto.java
|   +-- LoginRequestDto.java
|   +-- LoginResponseDto.java
|   +-- UpdateUserRequestDto.java
|   +-- UserResponseDto.java
+-- entity/
|   +-- Role.java                               <- Enum
|   +-- User.java                               <- JPA Entity
+-- exception/
|   +-- DuplicateUserException.java
|   +-- GlobalExceptionHandler.java
|   +-- UserNotFoundException.java
+-- repository/
|   +-- UserRepository.java
+-- security/
|   +-- CustomUserDetailsService.java
|   +-- JwtAuthFilter.java
|   +-- JwtUtil.java
+-- seed/
|   +-- DataSeeder.java
+-- service/
    +-- AuthService.java
    +-- UserManagementService.java
    +-- impl/
        +-- AuthServiceImpl.java
        +-- UserManagementServiceImpl.java
```

---

### 1. Config Layer

Located in `config/` — defines application-wide beans and configurations.

#### `CorsConfig.java`

Configures **Cross-Origin Resource Sharing** so the frontend (port 5173 or 3000) can communicate with the backend (port 8089) without browser blocking.

```
Allowed Origins:  http://localhost:5173 (Vite), http://localhost:3000
Allowed Methods:  GET, POST, PUT, DELETE, OPTIONS
Allowed Headers:  Authorization, Content-Type, Accept, X-Requested-With
Exposed Headers:  Authorization
Credentials:      Allowed
Preflight Cache:  3600 seconds (1 hour)
```

#### `JwtConfig.java`

Binds JWT properties from `application.properties` using `@ConfigurationProperties(prefix = "jwt")`.

| Property | Default Value | Description |
|---|---|---|
| `jwt.secret` | Base64 encoded string | HMAC-SHA256 signing key (min 256 bits) |
| `jwt.expiration` | `86400000` | Token validity in milliseconds (24 hours) |

#### `SecurityConfig.java`

The central Spring Security configuration. Defines:

- **Public routes**: `/api/auth/**`, `/h2-console/**`
- **Secured routes**: `/api/admin/**` requires `ROLE_SUPER_ADMIN`
- **All other routes**: require any valid authentication
- **Session policy**: `STATELESS` — no server-side sessions; JWT handles all state
- **Password encoder**: `BCryptPasswordEncoder`
- **Auth provider**: `DaoAuthenticationProvider` using `CustomUserDetailsService` + BCrypt
- **JWT filter**: `JwtAuthFilter` inserted before `UsernamePasswordAuthenticationFilter`

---

### 2. Entity Layer

Located in `entity/` — maps Java objects to database tables using JPA annotations.

#### `Role.java` — Enum

```java
public enum Role {
    SUPER_ADMIN,   // Full system access, manages all users
    ADMIN,         // Department admin, has a "department" field
    OFFICER,       // Traffic officer, has batch/rank/policeStation fields
    USER           // Basic user, no special fields
}
```

#### `User.java` — JPA Entity → Table: `users`

| Column | Java Field | Constraint | Notes |
|---|---|---|---|
| `id` | `Long id` | PK, Auto-increment | |
| `nic` | `String nic` | NOT NULL, UNIQUE | National Identity Card number |
| `full_name` | `String fullName` | NOT NULL | |
| `email` | `String email` | NOT NULL, UNIQUE | Used as login username |
| `password` | `String password` | NOT NULL | BCrypt hashed, never returned |
| `role` | `Role role` | NOT NULL, EnumType.STRING | One of the Role enum values |
| `department` | `String department` | Nullable | ADMIN role only |
| `batch_number` | `String batchNumber` | Nullable | OFFICER role only |
| `rank` | `String rank` | Nullable | OFFICER role only |
| `police_station` | `String policeStation` | Nullable | OFFICER role only |
| `created_at` | `LocalDateTime createdAt` | NOT NULL, NOT updatable | Auto-set via `@PrePersist` |

> **Role-field hygiene**: When creating or updating a user, the service explicitly sets irrelevant role fields to `null`. This keeps the database clean — an OFFICER never has a `department`, and an ADMIN never has `rank`.

---

### 3. DTO Layer

DTOs (Data Transfer Objects) are the data contracts between the API and its clients. They prevent internal entity details from leaking and enforce input validation via Jakarta Bean Validation annotations.

#### `LoginRequestDto.java` — Inbound

```json
{ "email": "user@example.com", "password": "secret123" }
```

Validation: `@NotBlank` on both fields, `@Email` on email.

#### `LoginResponseDto.java` — Outbound

```json
{
  "token": "eyJhbGci...",
  "id": 1,
  "email": "superadmin@traffic.gov.lk",
  "fullName": "System Super Admin",
  "role": "SUPER_ADMIN"
}
```

Note: **No password is ever included in any response DTO.**

#### `CreateUserRequestDto.java` — Inbound

Validates: `@NotBlank` on `nic`, `fullName`, `email`, `password`; `@Email` on `email`; `@NotNull` on `role`.
Optional fields: `department` (ADMIN), `batchNumber`, `rank`, `policeStation` (OFFICER).

#### `UpdateUserRequestDto.java` — Inbound

Same as `CreateUserRequestDto` except `password` is optional. If left blank or null, the existing password is preserved.

#### `AssignRoleRequestDto.java` — Inbound

A minimal DTO for role-only updates:
```json
{ "role": "ADMIN" }
```

#### `UserResponseDto.java` — Outbound

All user data except password, returned by all user-management endpoints:
```json
{
  "id": 2, "nic": "111111111V", "fullName": "Department Admin",
  "email": "admin@traffic.gov.lk", "role": "ADMIN",
  "department": "Traffic Control HQ", "batchNumber": null,
  "rank": null, "policeStation": null, "createdAt": "2024-07-21T10:00:00"
}
```

---

### 4. Repository Layer

Located in `repository/` — the data access layer. Extends Spring Data JPA's `JpaRepository<User, Long>` which auto-generates full CRUD operations.

#### `UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);    // Used by login & JWT auth
    Optional<User> findByNic(String nic);        // Used for duplicate NIC check on update
    boolean existsByEmail(String email);         // Used for duplicate email check on create
    boolean existsByNic(String nic);             // Used for duplicate NIC check on create
}
```

Spring Data JPA **automatically generates all SQL** from method names at runtime — no SQL code is written manually.

| Method | Generated SQL |
|---|---|
| `findAll()` | `SELECT * FROM users` |
| `findById(id)` | `SELECT * FROM users WHERE id = ?` |
| `findByEmail(email)` | `SELECT * FROM users WHERE email = ?` |
| `existsByNic(nic)` | `SELECT COUNT(*) > 0 FROM users WHERE nic = ?` |
| `save(user)` | `INSERT` or `UPDATE` based on whether ID exists |
| `delete(user)` | `DELETE FROM users WHERE id = ?` |

---

### 5. Security Layer

Located in `security/` — the three-class authentication pipeline.

#### `CustomUserDetailsService.java`

Implements Spring Security's `UserDetailsService`. Called during authentication to load user credentials from the database.

```
loadUserByUsername(email)
  +-- UserRepository.findByEmail(email)
  +-- Converts User entity to Spring Security UserDetails
  +-- Grants authority: "ROLE_" + user.getRole().name()
      Examples:
        Role.SUPER_ADMIN -> "ROLE_SUPER_ADMIN"
        Role.ADMIN       -> "ROLE_ADMIN"
        Role.OFFICER     -> "ROLE_OFFICER"
```

#### `JwtUtil.java`

A `@Component` for all JWT operations using the JJWT library.

| Method | Description |
|---|---|
| `generateToken(userId, email, role, fullName)` | Creates a signed JWT with custom claims |
| `extractEmail(token)` | Extracts the subject (email) from the token |
| `extractExpiration(token)` | Gets the expiration timestamp |
| `validateToken(token, userDetails)` | Verifies email match and token not expired |
| `getSigningKey()` | Derives HMAC-SHA256 key from the configured secret |

**JWT Payload structure**:
```json
{
  "id": 1,
  "role": "SUPER_ADMIN",
  "fullName": "System Super Admin",
  "sub": "superadmin@traffic.gov.lk",
  "iat": 1721556000,
  "exp": 1721642400
}
```

#### `JwtAuthFilter.java`

A `OncePerRequestFilter` — intercepts **every HTTP request exactly once** in the Spring Security filter chain.

**Step-by-step execution for every incoming request**:

1. Read the `Authorization` header
2. If missing or not starting with `"Bearer "` → skip filter, pass to next (request may fail later if route is protected)
3. Extract the raw token string (after the `"Bearer "` prefix)
4. Parse and extract the user email from the token using `JwtUtil`
5. If email extracted and no authentication set in `SecurityContextHolder` yet:
   - Load `UserDetails` from database via `CustomUserDetailsService`
   - Validate token signature + expiry via `JwtUtil.validateToken()`
   - If valid: create `UsernamePasswordAuthenticationToken` and store in `SecurityContextHolder`
6. Call `filterChain.doFilter()` to pass the request along

---

### 6. Service Layer

Located in `service/` — all business logic lives here. Each service has an interface (`AuthService`, `UserManagementService`) and an implementation (`AuthServiceImpl`, `UserManagementServiceImpl`) for loose coupling and testability.

#### `AuthServiceImpl.java`

**`login(LoginRequestDto)`**:
1. Calls `AuthenticationManager.authenticate()` with email and password
   - Spring Security internally uses `CustomUserDetailsService` to load the user
   - BCrypt verifies the hashed password
   - Throws `BadCredentialsException` if credentials are wrong
2. Fetches the full `User` entity from the database
3. Generates a JWT via `JwtUtil.generateToken()`
4. Returns `LoginResponseDto` containing the token and user metadata

#### `UserManagementServiceImpl.java`

**`getAllUsers()`**
- Fetches all users from the repository
- Streams and maps each `User` entity to `UserResponseDto`
- Returns the list

**`createUser(CreateUserRequestDto)`**
1. Checks for duplicate NIC — throws `DuplicateUserException` if found
2. Checks for duplicate email — throws `DuplicateUserException` if found
3. Creates a new `User` entity
4. BCrypt-encodes the password before saving
5. Sets role-specific fields; explicitly nulls out irrelevant fields
6. Saves to database and returns `UserResponseDto`

**`updateUser(id, UpdateUserRequestDto)`**
1. Finds user by ID — throws `UserNotFoundException` if not found
2. Checks for NIC conflicts with *other* users (allows unchanged NIC on same user)
3. Checks for email conflicts with *other* users (same logic)
4. Updates all fields
5. Only re-encodes password if a new (non-blank) password is provided in the request
6. Saves and returns `UserResponseDto`

**`updateUserRole(id, Role)`**
1. Finds user by ID — throws `UserNotFoundException` if not found
2. Sets the new role
3. Clears role-specific fields that don't belong to the new role
4. Saves and returns `UserResponseDto`

**`deleteUser(id)`**
1. Finds user by ID — throws `UserNotFoundException` if not found
2. Deletes the user from the database
3. Returns void (controller sends 204 No Content)

---

### 7. Controller Layer

Located in `controller/` — the HTTP entry points that map URLs to service calls.

#### `AuthController.java`

```
Base URL:  /api/auth
Security:  PUBLIC — no JWT required

POST /api/auth/login
  Request Body:  LoginRequestDto (validated with @Valid)
  Response:      200 OK, LoginResponseDto
```

#### `UserManagementController.java`

```
Base URL:  /api/admin/users
Security:  SUPER_ADMIN only
           - SecurityConfig: .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
           - Controller: @PreAuthorize("hasRole('SUPER_ADMIN')")

GET    /api/admin/users          -> getAllUsers()      -> 200 OK, List<UserResponseDto>
POST   /api/admin/users          -> createUser()       -> 201 Created, UserResponseDto
PUT    /api/admin/users/{id}     -> updateUser()       -> 200 OK, UserResponseDto
PUT    /api/admin/users/{id}/role-> updateUserRole()   -> 200 OK, UserResponseDto
DELETE /api/admin/users/{id}     -> deleteUser()       -> 204 No Content
```

All `@Valid` annotated request bodies are validated by Jakarta Bean Validation before the service is called. If validation fails, a `MethodArgumentNotValidException` is thrown and caught by the `GlobalExceptionHandler`.

---

### 8. Exception Handling

Located in `exception/` — provides centralized, consistent error responses across the entire API.

#### Custom Exception Classes

| Class | Extends | Thrown When |
|---|---|---|
| `UserNotFoundException` | `RuntimeException` | A user ID does not exist in the database |
| `DuplicateUserException` | `RuntimeException` | NIC or email already belongs to another user |

#### `GlobalExceptionHandler.java`

Annotated with `@RestControllerAdvice` — automatically catches exceptions from **all** `@RestController` classes globally.

| Exception Caught | HTTP Status | Error String | When |
|---|---|---|---|
| `UserNotFoundException` | 404 Not Found | "Not Found" | User ID not in DB |
| `DuplicateUserException` | 409 Conflict | "Conflict" | NIC or email duplicate |
| `BadCredentialsException` | 401 Unauthorized | "Unauthorized" | Wrong login credentials |
| `MethodArgumentNotValidException` | 400 Bad Request | "Bad Request" | DTO validation failure |
| `Exception` (catch-all) | 500 Internal Server Error | "Internal Server Error" | Unexpected errors |

**Standardized error response shape**:
```json
{
  "timestamp": "2024-07-21T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: 99"
}
```

**Validation error response** (field-level breakdown):
```json
{
  "timestamp": "2024-07-21T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "nic": "NIC is required"
  }
}
```

---

### 9. Data Seeder

Located in `seed/DataSeeder.java` — implements `CommandLineRunner`, executed **automatically on every application startup**.

**Logic**:
1. Queries the database for any existing user with `Role.SUPER_ADMIN`
2. If **none exists** → creates the default Super Admin:
   - NIC: `000000000V`
   - Full Name: `System Super Admin`
   - Email: `superadmin@traffic.gov.lk`
   - Password: `superadmin123` (stored as BCrypt hash)
   - Role: `SUPER_ADMIN`
   - Department: `System Provisioning`
3. If **already exists** → logs a skip message and does nothing

This makes the application **self-bootstrapping** — anyone who clones and runs it will always have a working Super Admin account to log in with on first run.

---

## 🎨 Frontend Deep-Dive

### Source Structure

```
frontend/src/
+-- main.jsx                    <- React entry point, wraps App in BrowserRouter
+-- App.jsx                     <- Root: providers, routing definition, layout
+-- index.css                   <- Global styles, design system, component classes
+-- context/
|   +-- AuthContext.jsx         <- Auth state: token, role, user info, axios config
+-- components/
|   +-- ProtectedRoute.jsx      <- Role-based route guard
+-- pages/
    +-- Login.jsx               <- Login form page
    +-- SuperAdminDashboard.jsx <- Full CRUD user management (Super Admin only)
    +-- AdminDashboard.jsx      <- Admin landing page
    +-- OfficerDashboard.jsx    <- Officer landing page
    +-- Unauthorized.jsx        <- 403 access denied page
```

### `AuthContext.jsx` — Global Auth State

Uses React Context API to share authentication state across the entire component tree without prop drilling.

**State shape**:
```js
{
  token: null | "eyJ...",          // JWT token string
  id: null | 1,                    // User's database ID
  role: null | "SUPER_ADMIN",      // Role string from server
  email: null | "user@example.com",
  fullName: null | "John Doe",
  isAuthenticated: false | true
}
```

**Exposed functions**:
- `login(email, password)` — POSTs to `/api/auth/login`, updates state, returns `{ success, role }` or `{ success, message }`
- `logout()` — Resets all state fields to null/false

**Automatic Axios integration** via `useEffect`:
```js
// Runs whenever authState.token changes:
if (authState.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
} else {
  delete axios.defaults.headers.common['Authorization'];
}
```

This means every Axios call in any component automatically carries the JWT without any manual configuration.

### `ProtectedRoute.jsx` — Route Guard

Wraps protected route definitions in `App.jsx`. Uses React Router's `<Outlet />` pattern.

```
Is isAuthenticated?            No  -> <Navigate to="/login" replace />
Is role in allowedRoles array? No  -> <Navigate to="/unauthorized" replace />
Both checks pass?              Yes -> <Outlet /> (renders child route)
```

### `App.jsx` — Application Router

```
Route                    Component              Guard
/login               ->  <Login />              (public)
/super-admin         ->  <SuperAdminDashboard/> (SUPER_ADMIN only)
/admin               ->  <AdminDashboard />     (ADMIN only)
/officer             ->  <OfficerDashboard />   (OFFICER only)
/unauthorized        ->  <Unauthorized />       (any authenticated user)
/                    ->  <NavigationWrapper />  (smart redirect by role)
*                    ->  redirect to /
```

The `Layout` component wraps all authenticated pages and provides:
- **Top navigation bar** with the app name and icon
- **User badge** showing the logged-in user's full name and role
- **Logout button** that clears auth state and redirects to `/login`

If the user is not authenticated, `Layout` renders children without the navbar (used by the Login page).

### `SuperAdminDashboard.jsx`

The core feature page. Uses Axios (with the auto-attached JWT) to call the backend:

| Action | Axios Call |
|---|---|
| Load users on mount | `GET /api/admin/users` |
| Create user | `POST /api/admin/users` |
| Edit user | `PUT /api/admin/users/{id}` |
| Change role only | `PUT /api/admin/users/{id}/role` |
| Delete user | `DELETE /api/admin/users/{id}` |

The create/edit form is **dynamic** — it shows/hides fields based on the selected role:
- **ADMIN** → shows `Department` field only
- **OFFICER** → shows `Batch Number`, `Rank`, `Police Station` fields
- **SUPER_ADMIN** / **USER** → no extra role-specific fields

---

## 🔗 How Frontend and Backend Connect

### The Proxy Bridge (Development)

The Vite dev server is configured in `frontend/vite.config.js` to proxy API calls:

```js
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8089',  // Spring Boot backend
      changeOrigin: true
    }
  }
}
```

**What this does**: When the React app calls `axios.get('/api/admin/users')`, Vite **silently forwards** that HTTP request to `http://localhost:8089/api/admin/users`. The browser never knows it's a different server. This means:

- No CORS issues during development (same-origin from the browser's perspective)
- The React code can use relative paths like `/api/...` instead of hardcoded backend URLs
- The backend's CORS config allows `localhost:5173` as a fallback for direct browser requests

> **In production**: Use an Nginx reverse proxy to forward `/api/*` to the Spring Boot service, or serve the Vite build output from Spring Boot itself.

### Full Login-to-Dashboard Data Flow

```
Step 1: [Login.jsx] - User submits email + password
        |
        v
Step 2: [AuthContext.login()] - calls axios.post('/api/auth/login', {email, password})
        |
        | Vite proxy transparently forwards to http://localhost:8089
        v
Step 3: [Spring Boot JwtAuthFilter] - no JWT on this public route, passes through
        |
        v
Step 4: [AuthController.login()] - receives LoginRequestDto
        |
        v
Step 5: [AuthServiceImpl.login()] - AuthenticationManager validates credentials
        |   +-- CustomUserDetailsService loads User from DB
        |   +-- BCrypt verifies raw password against stored hash
        v
Step 6: JwtUtil.generateToken() - creates signed JWT with id, role, fullName claims
        |
        v
Step 7: Returns LoginResponseDto { token, id, email, fullName, role }
        |
        v
Step 8: [AuthContext] - stores response in React state
        |   +-- axios.defaults.headers['Authorization'] = 'Bearer <token>'
        |   +-- isAuthenticated = true
        v
Step 9: [Login.jsx] - receives { success: true, role: "SUPER_ADMIN" }
        |   +-- React Router navigates to /super-admin
        v
Step 10:[ProtectedRoute] - checks isAuthenticated=true, role in ['SUPER_ADMIN']
        |   +-- Renders <SuperAdminDashboard />
        v
Step 11:[SuperAdminDashboard mounts] - calls axios.get('/api/admin/users')
        |   +-- Axios automatically sends 'Authorization: Bearer <token>' header
        v
Step 12:[Spring Boot JwtAuthFilter] - extracts and validates JWT
        |   +-- Sets ROLE_SUPER_ADMIN in SecurityContextHolder
        v
Step 13:[SecurityConfig + @PreAuthorize] - confirms SUPER_ADMIN role
        v
Step 14:[UserManagementController] -> [UserManagementServiceImpl] -> [UserRepository]
        v
Step 15: Returns List<UserResponseDto> as JSON -> Dashboard renders the user table
```

---

## 📡 API Reference

### Base URL: `http://localhost:8089`

#### Authentication (Public — no JWT required)

| Method | Endpoint | Request Body | Success Response |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` | `200 OK` — `LoginResponseDto` |

**Login error responses**:
- `401 Unauthorized` — Wrong email or password
- `400 Bad Request` — Missing or invalid fields

---

#### User Management (JWT Required — SUPER_ADMIN role only)

All endpoints require header: `Authorization: Bearer <token>`

| Method | Endpoint | Request Body | Success Response |
|---|---|---|---|
| `GET` | `/api/admin/users` | — | `200 OK` — `UserResponseDto[]` |
| `POST` | `/api/admin/users` | `CreateUserRequestDto` | `201 Created` — `UserResponseDto` |
| `PUT` | `/api/admin/users/{id}` | `UpdateUserRequestDto` | `200 OK` — `UserResponseDto` |
| `PUT` | `/api/admin/users/{id}/role` | `AssignRoleRequestDto` | `200 OK` — `UserResponseDto` |
| `DELETE` | `/api/admin/users/{id}` | — | `204 No Content` |

**Error responses for user management**:
- `401 Unauthorized` — Missing or invalid JWT
- `403 Forbidden` — Authenticated but not SUPER_ADMIN
- `404 Not Found` — User ID does not exist
- `409 Conflict` — NIC or email already in use
- `400 Bad Request` — Validation failure with field errors

---

## ⚙️ Installation — Backend

### Prerequisites

- Java 21 JDK installed and `JAVA_HOME` set
- MySQL 8.x server running locally

### Step 1: Create the MySQL Database

Connect to MySQL and run:
```sql
CREATE DATABASE trafficdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Configure the Database Connection

Open `demo/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/trafficdb?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD_HERE
```

**Using a different database?**

For **PostgreSQL**, comment out the MySQL block and uncomment the PostgreSQL block:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/trafficdb
spring.datasource.driverClassName=org.postgresql.Driver
spring.datasource.username=postgres
spring.datasource.password=1234
```

For **H2 (in-memory, no install needed)**, uncomment the H2 block:
```properties
spring.datasource.url=jdbc:h2:mem:trafficdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

> Warning: H2 data is lost when the application stops.

### Step 3: Verify Server Port

The backend defaults to port **8089** (`server.port=8089` in `application.properties`).

If you change this, also update `frontend/vite.config.js` → `proxy.target`.

### Step 4: (Optional) Customize the JWT Secret

```properties
# Must be at least 32 characters for HMAC-SHA256
jwt.secret=your-own-base64-encoded-secret-key-here
jwt.expiration=86400000
```

### Step 5: Run the Backend

```bash
# Go to the backend directory
cd demo

# Option A: Maven Wrapper (no Maven install needed)
mvnw.cmd spring-boot:run        # Windows
./mvnw spring-boot:run          # Linux / Mac

# Option B: If Maven is installed globally
mvn spring-boot:run

# Option C: Build a JAR and run it
mvnw.cmd clean package -DskipTests
java -jar target/institutionalprovisioning-0.0.1-SNAPSHOT.jar
```

Look for this in the console to confirm success:
```
>>> Super Admin user already exists. Skipping seeding.
Started InstitutionalProvisioningApplication in X.XXX seconds (JVM running for X.XXX)
```

### Step 6: Verify the Backend

Test the login endpoint with a quick curl:
```bash
curl -X POST http://localhost:8089/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"superadmin@traffic.gov.lk\",\"password\":\"superadmin123\"}"
```

Expected response (shortened):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "id": 1,
  "email": "superadmin@traffic.gov.lk",
  "fullName": "System Super Admin",
  "role": "SUPER_ADMIN"
}
```

### Step 7: (Optional) Load Additional Seed Data via SQL

If you want the additional default ADMIN, OFFICER, and USER accounts:
```bash
mysql -u root -p trafficdb < db-setup.sql
```

---

## ⚙️ Installation — Frontend

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Verify Proxy Configuration

Open `frontend/vite.config.js` and confirm the backend port:

```js
proxy: {
  '/api': {
    target: 'http://localhost:8089',  // Must match server.port in application.properties
    changeOrigin: true
  }
}
```

### Step 3: Start the Development Server

```bash
npm run dev
```

The frontend starts at: **http://localhost:5173**

Open the URL in your browser and log in with the Super Admin credentials.

### Step 4: Build for Production (Optional)

```bash
npm run build
# Output is placed in the frontend/dist/ folder
# Deploy these static files to any web server (Nginx, Apache, Vercel, etc.)
```

---

## 🔐 Default Login Credentials

These accounts are created automatically by `DataSeeder.java` (Super Admin) and by the SQL script in `db-setup.sql` (the rest).

| Role | Email | Password | Redirect After Login |
|---|---|---|---|
| `SUPER_ADMIN` | `superadmin@traffic.gov.lk` | `superadmin123` | `/super-admin` — Full CRUD management |
| `ADMIN` | `admin@traffic.gov.lk` | `admin123` | `/admin` — Admin dashboard |
| `OFFICER` | `officer@traffic.gov.lk` | `officer123` | `/officer` — Officer dashboard |
| `USER` | `user@traffic.gov.lk` | `user123` | `/unauthorized` — No role dashboard |

> **Security warning**: Change all default passwords before using this system in any non-local environment.

---

## 📁 Project Structure

```
Digital Lanka/
+-- README.md                              <- This file
+-- .gitignore
|
+-- demo/                                  <- Spring Boot Backend
|   +-- pom.xml                            <- Maven project file and dependencies
|   +-- db-setup.sql                       <- Manual SQL seed script (optional)
|   +-- mvnw / mvnw.cmd                   <- Maven wrapper scripts
|   +-- src/
|       +-- main/
|           +-- java/com/digitallanka/institutionalprovisioning/
|           |   +-- InstitutionalProvisioningApplication.java  <- main() entry point
|           |   +-- config/               <- CorsConfig, JwtConfig, SecurityConfig
|           |   +-- controller/           <- AuthController, UserManagementController
|           |   +-- dto/                  <- All Request/Response DTOs
|           |   +-- entity/               <- User.java (JPA), Role.java (enum)
|           |   +-- exception/            <- Custom exceptions, GlobalExceptionHandler
|           |   +-- repository/           <- UserRepository (Spring Data JPA)
|           |   +-- security/             <- JwtUtil, JwtAuthFilter, CustomUserDetailsService
|           |   +-- seed/                 <- DataSeeder (startup initialization)
|           |   +-- service/              <- Business logic interfaces + impl/
|           +-- resources/
|               +-- application.properties <- DB, server port, JWT configuration
|
+-- frontend/                              <- React + Vite Frontend
    +-- package.json                       <- npm dependencies and scripts
    +-- vite.config.js                     <- Dev server config and API proxy
    +-- index.html                         <- HTML shell
    +-- src/
        +-- main.jsx                       <- React app entry, BrowserRouter wrapper
        +-- App.jsx                        <- Router definition, Layout component
        +-- index.css                      <- Global design system and component styles
        +-- context/
        |   +-- AuthContext.jsx            <- JWT storage, axios config, login/logout
        +-- components/
        |   +-- ProtectedRoute.jsx         <- Auth + role-based route guard
        +-- pages/
            +-- Login.jsx                  <- Login form
            +-- SuperAdminDashboard.jsx    <- User CRUD dashboard
            +-- AdminDashboard.jsx         <- Admin landing page
            +-- OfficerDashboard.jsx       <- Officer landing page
            +-- Unauthorized.jsx           <- 403 access denied page
```

---

## 🏃 Quick Start — Run Both Together

Open **two terminal windows**:

**Terminal 1 — Start Backend:**
```bash
cd "Digital Lanka/demo"
mvnw.cmd spring-boot:run
# Wait until you see: Started InstitutionalProvisioningApplication
```

**Terminal 2 — Start Frontend:**
```bash
cd "Digital Lanka/frontend"
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

Log in with: `superadmin@traffic.gov.lk` / `superadmin123`

---

*Built for the Digital Lanka Initiative — Module 6: Institutional Provisioning*
