# Batloung Farm Distribution System

A React dashboard and Node.js API for managing fruit stock, supplier purchases,
vendor sales, payments, and reporting.

## Project layout

- `frontend/` - React 19 and Vite application
- `backend/` - Express API and MySQL access
- `batloung_farm_database.sql` - database schema and sample data

## Requirements

- Node.js 20.19+ or 22.12+
- MySQL 8.0+

## Local setup

1. Create the database by running `batloung_farm_database.sql` in MySQL
   Workbench or with your MySQL client.
2. Copy `backend/.env.example` to `backend/.env` and set your local MySQL
   credentials. Never commit `backend/.env`.
3. In a terminal, install and start the API:

   ```sh
   cd backend
   npm install
   npm start
   ```

4. In a second terminal, install and start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite. The API uses `http://localhost:5000/api`.
   The dashboard reports API/database connection status.

## Checks

From `frontend/`:

```sh
npm run lint
npm run build
```

The backend expects the SQL tables to exist and MySQL to be running before
database-backed features can be used.

Sale prices are fixed by package size and shared across fruits: SMALL M25,
MEDIUM M50, and LARGE M75. The API calculates sale totals from this schedule.
Update `backend/config/sellingPrices.js` if these demonstration prices need to
change.

## Database reset warning

`batloung_farm_database.sql` includes `DROP TABLE` statements and sample records.
Running it against an existing database deletes and recreates those tables.
Back up any data you need before executing the script.

## GitHub and submission

The root `.gitignore` excludes dependencies, build output, archives, and local
environment files. Keep real credentials in `backend/.env`; only the
placeholder `backend/.env.example` belongs in source control.

For a submission archive, include the project source and SQL script, but omit
`.env` files, `node_modules/`, `frontend/dist/`, and any private credentials.
The application currently targets a locally running API and MySQL database;
publishing the source to GitHub does not deploy those services.
