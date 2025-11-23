# 🏗️ Smeta - Complete Multi-Platform Construction Cost Estimation System

## 📋 Overview

Professional construction cost estimation application with full support for FER/GESN/TER Russian construction norms, AI-powered estimation, multi-platform support (Web/Mobile/Desktop), and offline capabilities.

## 🎯 Key Features

### 💰 Cost Estimation
- **FER/GESN/TER Norms**: Complete database of Russian construction norms
- **Automatic Norm Matching**: AI-powered selection of appropriate norms
- **Volume Calculations**: Automatic calculation of work volumes (m², m³, linear meters)
- **Regional Coefficients**: Support for regional pricing adjustments
- **Price Indices**: Historical price recalculation with inflation indices

### �� AI Capabilities
- **Text-to-Estimate**: Generate estimates from project descriptions
- **Photo Recognition**: Identify construction work from photos
- **Work Classification**: Automatic categorization of construction works
- **Norm Recommendation**: AI suggests appropriate FER/GESN/TER codes
- **BIM/IFC Support**: Parse and analyze Building Information Models

### 📱 Multi-Platform
- **Web Application**: Progressive Web App with offline support
- **Mobile Apps**: Native iOS and Android applications
- **Desktop**: Installable desktop application
- **Offline Mode**: Full functionality without internet connection
- **Cloud Sync**: Synchronize data across devices

## 🚀 Technology Stack

### Backend
- **NestJS 10** - Enterprise Node.js framework
- **TypeORM** - ORM for database operations
- **PostgreSQL 14** - Main database
- **JWT + Passport** - Authentication
- **Swagger** - API documentation

### WASM Core
- **Rust** - Systems programming language
- **wasm-bindgen** - JavaScript bindings
- **SIMD** - Optimized calculations
- **Binary Format** - Efficient norm storage

### AI/ML
- **Google Gemini API** - Large language model
- **TensorFlow** - Machine learning
- **Python** - Training scripts

### Mobile
- **React Native** - Cross-platform framework
- **SQLite** - Offline database
- **Camera API** - Photo capture

## 📦 Directory Structure

```
smeta/
├── backend/              # NestJS Backend API
├── wasm_core/           # Rust WASM Core
├── frontend/            # React + Next.js
├── mobile/              # React Native
├── ai/                  # AI/ML Module
├── docs/                # Documentation
└── devops/              # Deployment configs
```

See full ARCHITECTURE.md for complete details.
