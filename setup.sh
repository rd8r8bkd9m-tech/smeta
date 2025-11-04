#!/bin/bash

# Modern Stack Setup Script for Smeta PWA
# This script initializes the development environment

set -e

echo "🚀 Setting up modern development stack for Smeta PWA..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js version: $node_version"

if [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    echo "❌ Node.js 18 or higher is required"
    exit 1
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

# Run type checking
echo ""
echo "🔍 Running type checks..."
npm run type-check

# Run linting
echo ""
echo "✨ Running linter..."
npm run lint

# Run tests
echo ""
echo "🧪 Running tests..."
npm test -- --run

echo ""
echo "✅ Setup complete! You can now:"
echo "   • npm run dev      - Start development server"
echo "   • npm run build    - Build for production"
echo "   • npm test         - Run tests"
echo "   • npm run lint     - Check code quality"
echo ""
echo "📚 See MODERN_STACK.md for more information"
