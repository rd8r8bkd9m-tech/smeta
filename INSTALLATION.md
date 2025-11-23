# 📦 Installation Guide

## Complete Multi-Platform Construction Cost Estimation System

This guide covers installation of all system components.

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB
- **OS**: Linux, macOS, or Windows 10+

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS or macOS

## Prerequisites

### 1. Install Node.js 18+

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@18

# Verify installation
node --version
npm --version
```

### 2. Install PostgreSQL 14+

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@14

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@14  # macOS
```

### 3. Install Rust (for WASM core)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version
```

### 4. Install wasm-pack

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
wasm-pack --version
```

### 5. Install Python 3.9+ (for AI module)

```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip

# macOS
brew install python@3.9

# Verify
python3 --version
pip3 --version
```

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/rd8r8bkd9m-tech/smeta.git
cd smeta
```

### Step 2: Database Setup

```bash
# Create database user and database
sudo -u postgres psql
CREATE USER smeta_user WITH PASSWORD 'smeta_password';
CREATE DATABASE smeta_db OWNER smeta_user;
GRANT ALL PRIVILEGES ON DATABASE smeta_db TO smeta_user;
\q
```

### Step 3: Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run migrations
npm run migration:run

# Start backend
npm run start:dev
```

Backend will be available at `http://localhost:3000`

### Step 4: Build WASM Core

```bash
cd ../wasm_core
wasm-pack build --target web --release

# WASM module will be in pkg/ directory
```

### Step 5: Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env

# Edit .env
nano .env

# Start frontend
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Step 6: AI Module Setup (Optional)

```bash
cd ../ai
npm install
pip3 install -r requirements.txt

# Set Gemini API key
export GEMINI_API_KEY=your_api_key_here

# Start AI service
npm start
```

### Step 7: Mobile App Setup (Optional)

#### iOS (macOS only)

```bash
cd ../mobile
npm install
cd ios
pod install
cd ..
npm run ios
```

#### Android

```bash
cd ../mobile
npm install
npm run android
```

## Docker Installation (Recommended)

For easier deployment, use Docker:

```bash
# Install Docker and Docker Compose
# See https://docs.docker.com/engine/install/

# Start all services
docker-compose up -d

# Services will be available at:
# - Backend: http://localhost:3000
# - Frontend: http://localhost:80
# - Database: localhost:5432
```

## Verification

### 1. Check Backend

```bash
curl http://localhost:3000/api/docs
```

Should show Swagger API documentation.

### 2. Check Frontend

Open `http://localhost:5173` in browser.

### 3. Check Database

```bash
psql -U smeta_user -d smeta_db -h localhost
\dt  # List tables
```

## Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database credentials in `.env`
- Check logs: `npm run start:dev`

### WASM build fails

- Ensure Rust is installed: `rustc --version`
- Install wasm-pack: `cargo install wasm-pack`
- Check Cargo.toml syntax

### Frontend errors

- Clear node_modules: `rm -rf node_modules && npm install`
- Check backend is running
- Verify API URL in .env

### Database connection errors

- Check PostgreSQL is running
- Verify credentials
- Check firewall settings

## Next Steps

1. **Import Norms Data**: Load FER/GESN/TER norms into database
2. **Configure AI**: Set up Gemini API key
3. **Create Admin User**: Register first user through API
4. **Import Templates**: Load estimate templates
5. **Configure Regional Coefficients**: Set up regional pricing

## Support

- **Documentation**: See `/docs` directory
- **Issues**: https://github.com/rd8r8bkd9m-tech/smeta/issues
- **API Docs**: http://localhost:3000/api/docs

## Security Notes

- Change default database password
- Use strong JWT secret
- Enable HTTPS in production
- Configure CORS properly
- Keep API keys secure

---

**Installation complete! 🎉**
