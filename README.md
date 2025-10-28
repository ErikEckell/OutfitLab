# 👗 OutfitLab

**An intelligent outfit recommendation app that suggests clothing combinations based on user preferences and current weather conditions.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![Django](https://img.shields.io/badge/django-4.2-green.svg)
![React](https://img.shields.io/badge/react-18.0-61dafb.svg)
![Node](https://img.shields.io/badge/node-20.0-green.svg)

## Features

- **Smart Recommendations:** AI-powered outfit suggestions based on weather data
- **User Preferences:** Personalized recommendations based on style preferences
- **Weather Integration:** Real-time weather data for location-based suggestions
- **Modern UI:** Clean, responsive React interface
- **REST API:** Robust Django backend with RESTful endpoints

## Tech Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **Python 3.12** - Programming language

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **JavaScript/JSX** - Programming language
- **CSS3** - Styling

### DevOps
- **Docker & Docker Compose** - Containerization
- **PostgreSQL 16** - Production database

## 🚀 Quick Start

### Using Docker (Recommended)

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
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Manual Setup

See [Instructions.md](Instructions.md) for detailed development setup instructions.

## Project Structure

```
OufitLab/
├── backend/                 # Django REST API
│   ├── backend/            # Project settings
│   ├── myapi/              # Main application
│   └── requirements.txt    # Python dependencies
├── frontend/               # React application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
├── docker-compose.yml      # Docker configuration
├── Instructions.md         # Development guide
└── README.md              # Project overview
```

## API Endpoints

The Django backend provides RESTful API endpoints:

- `GET /api/hello/` - Test endpoint
- `GET /api/outfits/` - Get outfit recommendations
- `POST /api/preferences/` - Save user preferences
- `GET /api/weather/` - Get weather data

*Full API documentation available at http://localhost:8000/api/ when running*

## 🔧 Development

### Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 20+ (for local development)
- Git

### Environment Setup

1. **Clone and start:**
   ```bash
   git clone https://github.com/ErikEckell/OutfitLab
   cd OufitLab
   docker compose up --build
   ```

2. **For active development:**
   See [Instructions.md](Instructions.md) for detailed setup instructions including:
   - Local backend development with Django
   - Frontend development with Vite
   - Database configuration
   - Troubleshooting guide


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or run into issues:

1. Check the [Instructions.md](Instructions.md) for detailed setup help

---

**Built with ❤️ for fashion-forward developers**
