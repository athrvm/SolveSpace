# SolveSpace

SolveSpace is a full-stack platform for practising data structures and algorithms. Users can browse problems, write and run code, submit solutions, watch video editorials and ask an AI assistant for help. Administrators manage the problem library and editorial videos.

Code execution uses **self-hosted, open-source Judge0 running in Docker**. No hosted Judge0 subscription or RapidAPI key is required.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Redux Toolkit, Tailwind CSS, daisyUI |
| Editor and forms | Monaco Editor, React Hook Form, Zod |
| Backend | Node.js, Express, Mongoose |
| Storage and authentication | MongoDB, Redis, JWT, bcrypt |
| Code execution | Self-hosted Judge0, Docker Compose |
| AI assistant | Google Gemini |
| Video storage | Cloudinary |

## 1. Prerequisites

Install or prepare:

- Git.
- Node.js 22.12 or later within the 22.x series, and npm.
- Docker with the Docker Compose plugin.
- A running MongoDB instance.
- A running Redis instance for application authentication.
- A Gemini API key for the assistant.
- Cloudinary credentials for editorial video uploads.

The instructions below run the frontend and backend directly on your computer, with Judge0 in Docker.

## 2. Clone the repository

Replace `YOUR_GITHUB_USERNAME` and the repository name if necessary:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/SolveSpace.git
cd SolveSpace
```

The clone URL is a placeholder; replace it with your published repository's URL.

## 3. Install dependencies

From the project root:

```bash
cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

Both folders have their own dependencies and start commands.

## 4. Configure environment variables

Create a file named `.env` inside `backend/`:

```dotenv
PORT=3000
DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/solvespace
JWT_KEY=replace_with_a_long_random_secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# Uncomment if your application Redis requires authentication:
# REDIS_USERNAME=default
# REDIS_PASSWORD=your_redis_password

BATCH_SUBMISSION_URL=http://127.0.0.1:2358/submissions/batch

GEMINI_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholders with your credentials. If MongoDB or Redis runs remotely, supply its connection details. Start both services before starting the backend.

The current Redis client does not configure TLS; a provider requiring TLS needs an adjustment in `backend/src/config/redis.js`.

The assistant's model is configured in `backend/src/controllers/solveDoubt.js`. Use a model available to your Gemini account.

No frontend `.env` is required by the current code. The API URL is set in `frontend/src/utils/axiosClient.js`, and the allowed frontend origin is set in `backend/src/index.js`.

**Do not commit real environment files or credentials.**

## 5. Set up and run Judge0

### Start Docker

Start Docker Desktop or, on Linux with systemd:

```bash
sudo systemctl start docker
```

Check that Docker is available:

```bash
docker info
docker compose version
```

### Prepare Judge0 configuration

From the project root:

```bash
cd judge0-v1.13.1

# Preserve an existing working configuration.
if [ ! -f judge0.conf ]; then
  cp judge0.conf.example judge0.conf
fi
```

Edit the following settings in `judge0.conf`, replacing the passwords:

```dotenv
POSTGRES_HOST=db
POSTGRES_PASSWORD=your_judge0_database_password
REDIS_HOST=redis
REDIS_PASSWORD=your_judge0_redis_password
ENABLE_BATCHED_SUBMISSIONS=true
```

Keep the other template settings. Do not commit the real `judge0.conf`.

The included Compose file starts the Judge0 server, execution workers, PostgreSQL and Redis. **Judge0's Redis is separate from the application Redis in `backend/.env`**; this stack does not start SolveSpace's MongoDB or authentication Redis.

### First startup

Run inside `judge0-v1.13.1/`:

```bash
docker compose up -d db redis
docker compose up -d server workers
docker compose ps
```

Allow the services to initialise, then check the server:

```bash
curl --fail http://127.0.0.1:2358/languages
```

This should return a JSON list of supported languages. The backend expects IDs `54` for C++, `62` for Java and `63` for JavaScript.

If services fail to start, inspect the logs:

```bash
docker compose logs --tail=100 db redis server workers
```

Keep `BATCH_SUBMISSION_URL=http://127.0.0.1:2358/submissions/batch` in the backend environment. Once the application has a problem, use **Run** to verify execution through the workers.

### Run Judge0 again

Start Docker, then run from the project root:

```bash
cd judge0-v1.13.1
docker compose up -d
```

You do not need to copy or recreate the configuration each time.

To stop Judge0 while keeping its data, run from the same folder:

```bash
docker compose stop
```

Avoid `docker compose down -v` unless you intend to delete its database volume. Changing `POSTGRES_PASSWORD` in the configuration alone does not change the password in an already-initialised database.

## 6. Start the application

Ensure MongoDB, application Redis and Judge0 are running.

In a terminal at the project root, start the backend:

```bash
cd backend
npm start
```

In a second terminal at the project root, start the frontend:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**.

The backend runs at **http://localhost:3000**. Use these ports and `localhost` with the current configuration. If you change them, update the frontend API URL, backend CORS origin and Vite configuration accordingly.

For later sessions, start the required services and repeat these two commands. Press `Ctrl+C` in each terminal to stop the frontend and backend.

## 7. Create the first administrator

Public registration creates regular users. To create the first admin:

1. Register an account at `http://localhost:5173/signup`.
2. Open your application's database in MongoDB Compass or `mongosh`.
3. Find your account in the `users` collection and change `role` to `admin`.
4. Log out and sign in again so the session includes your updated role.
5. Open `http://localhost:5173/admin`.

For the sample database, run this inside `mongosh`, replacing the email with the one you registered:

```javascript
db.getSiblingDB("solvespace").users.updateOne(
  { emailId: "your-registered-email@example.com" },
  { $set: { role: "admin" } }
)
```

A fresh database contains no problems or default administrator account.

## 8. Administrator features

### Create problems

Open **Admin → Create problem** and provide:

- Title and description, including input/output requirements.
- Difficulty: `easy`, `medium` or `hard`.
- One topic: `array`, `linkedList`, `graph` or `dp`.
- Visible test cases with input, expected output and explanations.
- Hidden test cases with input and expected output.
- Starter code and reference solutions for C++, Java and JavaScript.

Provide complete programmes that read standard input and write standard output. Java solutions should use `public class Main`.

Judge0 must be running: the backend checks reference solutions against visible cases before saving. Verify hidden cases separately.

### Edit and delete problems

- Open **Admin → Update problems**, select a problem, edit its pre-filled form and submit. Reference solutions are validated again.
- Open **Admin → Manage problems** to delete a problem.

### Add and remove editorial videos

1. Configure the three Cloudinary variables in `backend/.env` and restart the backend if they changed.
2. Open **Admin → Editorial videos**.
3. Select the problem's upload action, choose a video file and submit.
4. Wait for upload completion. The browser uploads the video to Cloudinary, and the backend saves its verified metadata.
5. Open the problem's **Editorial** tab to watch it.

Use the editorial management page to delete an existing video. This removes its metadata and Cloudinary asset.

## 9. User features

- **Problem library:** browse paginated problems and search by title; filter by difficulty, topic and recorded solved status.
- **Code editor:** write C++, Java or JavaScript in Monaco and resize the workspace panels.
- **Run and Submit:** run visible examples or submit against hidden tests.
- **Submission history:** review previous code, results, runtime and memory.
- **Autosaved drafts:** restore code for the same account, problem and language in the same browser.
- **Bookmarks:** save problems to your account and access them from another browser after signing in.
- **Reference solutions:** view the provided solutions in the workspace.
- **Video editorials:** play/pause, seek, skip ten seconds forwards or backwards, change volume or speed, and enter fullscreen.
- **AI assistant:** ask questions about the problem, receive streamed replies and stop generation. Paste your code into the message when asking for code-specific help.
- **Themes:** choose light, dark or system appearance.

Drafts are stored in browser storage and disappear if that storage is cleared. Chat history is not saved permanently and resets when the chat component closes or the page reloads.

## Troubleshooting

| Issue | What to check |
| --- | --- |
| Session-check connection error | Backend availability, MongoDB, application Redis and the configured API URL. |
| Admin access missing after changing the role | Log out and sign in again. |
| Empty problem library | Create problems using an administrator account. |
| Run, Submit or problem creation fails | Judge0 containers, logs, language IDs and batch endpoint configuration. |
| AI assistant fails | Gemini key, configured model access and quota. |
| Video upload fails | Cloudinary credentials and administrator authentication. |
| Port 5173 is occupied | Stop the conflicting process before starting Vite. |
