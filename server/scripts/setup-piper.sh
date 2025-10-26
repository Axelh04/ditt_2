#!/bin/bash

set -e  # Exit on error

echo "🔧 Setting up Piper TTS..."

# Determine installation directory
PIPER_DIR="${PIPER_DIR:-$(pwd)/piper}"
MODELS_DIR="$PIPER_DIR/models"

# Create directories
mkdir -p "$PIPER_DIR"
mkdir -p "$MODELS_DIR"

# Determine platform and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case "$ARCH" in
  x86_64)
    ARCH="amd64"
    ;;
  aarch64|arm64)
    ARCH="arm64"
    ;;
  *)
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Map OS names and set download URL
# Using v1.2.0 release from GitHub
PIPER_VERSION="2023.11.14-2"
case "$OS" in
  linux)
    if [ "$ARCH" = "amd64" ]; then
      PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz"
    elif [ "$ARCH" = "arm64" ]; then
      PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_aarch64.tar.gz"
    fi
    ;;
  darwin)
    # macOS builds not always available, use Linux build with Rosetta or skip
    echo "⚠️  macOS detected - Piper TTS binaries may not be available"
    echo "📝 For local development, you can use ElevenLabs or test on Linux/Render"
    echo "💡 Creating placeholder installation (TTS will work on Render deployment)"
    
    # Create a placeholder that will work on Render but skip locally
    touch "$PIPER_DIR/piper"
    chmod +x "$PIPER_DIR/piper"
    
    # Still download the model
    VOICE_MODEL="en_US-lessac-medium"
    MODEL_FILE="$MODELS_DIR/${VOICE_MODEL}.onnx"
    MODEL_JSON="$MODELS_DIR/${VOICE_MODEL}.onnx.json"
    
    if [ ! -f "$MODEL_FILE" ] || [ ! -f "$MODEL_JSON" ]; then
      echo "📥 Downloading voice model: $VOICE_MODEL..."
      curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx" \
        -o "$MODEL_FILE"
      curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json" \
        -o "$MODEL_JSON"
    fi
    
    echo "✅ Setup complete (placeholder for macOS)"
    echo "📝 Note: Use TTS_PROVIDER=elevenlabs for local testing on macOS"
    echo "🚀 Piper TTS will work when deployed to Render (Linux)"
    exit 0
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

# Download and extract Piper if not already present
if [ ! -f "$PIPER_DIR/piper" ] || [ ! -s "$PIPER_DIR/piper" ]; then
  echo "📥 Downloading Piper TTS for $OS ($ARCH)..."
  curl -L "$PIPER_URL" -o /tmp/piper.tar.gz
  
  echo "📦 Extracting Piper TTS..."
  tar -xzf /tmp/piper.tar.gz -C "$PIPER_DIR" --strip-components=1
  rm /tmp/piper.tar.gz
  
  chmod +x "$PIPER_DIR/piper"
  echo "✅ Piper TTS installed to $PIPER_DIR/piper"
else
  echo "✅ Piper TTS already installed"
fi

# Download voice model if not already present
VOICE_MODEL="en_US-lessac-medium"
MODEL_FILE="$MODELS_DIR/${VOICE_MODEL}.onnx"
MODEL_JSON="$MODELS_DIR/${VOICE_MODEL}.onnx.json"

if [ ! -f "$MODEL_FILE" ] || [ ! -f "$MODEL_JSON" ]; then
  echo "📥 Downloading voice model: $VOICE_MODEL..."
  
  # Download from Hugging Face (more reliable than GitHub releases)
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx" \
    -o "$MODEL_FILE"
  
  curl -L "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json" \
    -o "$MODEL_JSON"
  
  echo "✅ Voice model installed"
else
  echo "✅ Voice model already installed"
fi

# Test Piper installation
echo "🧪 Testing Piper TTS..."
echo "Hello from Piper TTS!" | "$PIPER_DIR/piper" --model "$MODEL_FILE" --output_raw > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Piper TTS is working correctly!"
  echo ""
  echo "📍 Piper binary: $PIPER_DIR/piper"
  echo "📍 Voice model: $MODEL_FILE"
  echo ""
  echo "🎉 Setup complete!"
else
  echo "⚠️  Piper TTS test had issues, but installation complete"
  echo "📍 Piper binary: $PIPER_DIR/piper"
  echo "📍 Voice model: $MODEL_FILE"
fi

