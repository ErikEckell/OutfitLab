# OutfitLab Development Guide

OutfitLab is a full-stack application with a Django backend and React frontend that recommends outfits based on user preferences and weather conditions.

## Quick Start with Docker (Recommended)

This is the easiest way to get the entire application running with all dependencies.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ErikEckell/OutfitLab
   cd OufitLab
   ```

2. **Start the application:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - **Frontend (React):** http://localhost:5173
   - **Backend API (Django):** http://localhost:8000
   - **Database:** PostgreSQL running on port 5432

4. **Stop the application:**
   ```bash
   # Press Ctrl+C to stop, then run:
   docker compose down
   ```

### Useful Docker Commands

```bash
# Start in detached mode (runs in background)
docker compose up -d

# View logs
docker compose logs
docker compose logs backend  # specific service logs
docker compose logs -f       # follow logs in real-time

# Stop and remove all containers/volumes (clean reset)
docker compose down -v

# Rebuild only when you change dependencies
docker compose up --build
```

---

## Local Development Setup

For active development where you want to make changes and see them reflected immediately.

### Backend (Django) Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

   The Django backend will be available at http://localhost:8000

### Frontend (React) Setup

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Start the development server:**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

   The React frontend will be available at http://localhost:5173

---

## Database Setup

### Using Docker (Automatic)
When using `docker compose up`, PostgreSQL is automatically configured with:
- Database: `oufitlab`
- Username: `oufitlabuser`
- Password: `oufitlabpass`

### Local Development Database
For local development, you can either:
1. Use the Docker database while running backend locally
2. Install PostgreSQL locally and update `backend/settings.py`

---

## Development Workflow

### Making Changes

1. **Backend changes:** Modify files in `backend/` directory
   - Django will auto-reload when you save files
   - For database changes, create and run migrations:
     ```bash
     python manage.py makemigrations
     python manage.py migrate
     ```

2. **Frontend changes:** Modify files in `frontend/src/` directory
   - Vite will hot-reload automatically
   - Changes appear instantly in the browser

### Docker Development
If using Docker for development:
```bash
# Files are mounted as volumes, so changes reflect automatically
# Restart only if you change dependencies
docker compose restart backend  # restart specific service
docker compose restart frontend
```

---

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :8000  # or :5173, :5432
   # Stop conflicting processes or change ports in docker-compose.yml
   ```

2. **Database connection errors:**
   ```bash
   # Clean restart with fresh database
   docker compose down -v
   docker compose up --build
   ```

3. **Permission errors on Linux:**
   ```bash
   # Make sure Docker daemon is running
   sudo systemctl start docker
   # Add your user to docker group (logout/login required)
   sudo usermod -aG docker $USER
   ```

4. **Frontend not loading:**
   - Check if port 5173 is available
   - Verify `node_modules` are installed properly
   - Try clearing browser cache

### Logs and Debugging

```bash
# View all container logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Check specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Execute commands inside containers
docker compose exec backend python manage.py shell
docker compose exec db psql -U oufitlabuser -d oufitlab
```

---

## Project Structure

```
OufitLab/
├── backend/                 # Django REST API
│   ├── backend/            # Django project settings
│   ├── myapi/              # Django app
│   ├── requirements.txt    # Python dependencies
│   └── manage.py           # Django management script
├── frontend/               # React application
│   ├── src/                # React source code
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
├── docker-compose.yml      # Docker services configuration
└── README.md               # Project overview
```

---

## Production Deployment

For production deployment, additional considerations include:
- Environment variables for secrets
- Static file serving
- Database backups
- SSL/HTTPS setup
- Load balancing
- Monitoring and logging


CREAR LA BD EN LOCAL PARA DEV
sudo -u postgres psql -c "CREATE USER myuser WITH PASSWORD 'mypass';"
sudo -u postgres psql -c "CREATE DATABASE mydb OWNER myuser;"
run the backend

