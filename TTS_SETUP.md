# Text-to-Speech (TTS) Setup Guide

This project now uses **Piper TTS** by default - a fast, free, and open-source text-to-speech engine with low latency and high quality output.

## Why Piper TTS?

- ✅ **100% FREE** - No API costs, no usage limits
- ✅ **Low Latency** - Generates audio in ~100-500ms for typical scripts
- ✅ **Good Quality** - Natural-sounding voices
- ✅ **Privacy** - Runs locally, no data sent to third parties
- ✅ **Works on Render Free Tier** - No external dependencies

## Quick Start

### Local Development

1. **Install Piper TTS** (one-time setup):
   ```bash
   cd server
   npm run setup-piper
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test it out**: The TTS endpoint will now use Piper automatically!

### Render Deployment

Piper TTS is automatically installed during deployment on Render. No manual setup required! 🎉

The `render.yaml` configuration includes:
- Automatic Piper installation during build
- Pre-configured environment variables
- Ready-to-use voice model

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_PROVIDER` | `piper` | Set to `elevenlabs` to use ElevenLabs instead |
| `PIPER_DIR` | `./piper` | Directory where Piper is installed |

### Switching TTS Providers

You can switch between Piper TTS and ElevenLabs:

**Use Piper (Free, Default)**:
```bash
# In .env file or environment
TTS_PROVIDER=piper
```

**Use ElevenLabs** (requires API key):
```bash
# In .env file or environment
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_api_key_here
```

## Voice Models

By default, the system uses the **en_US-lessac-medium** voice:
- English (US accent)
- Medium quality (~22MB model size)
- Natural and pleasant tone
- Good balance of speed and quality

### Available Voice Options

Piper supports many other voices. To use a different voice:

1. Download from [Piper Voices Repository](https://github.com/rhasspy/piper/blob/master/VOICES.md)
2. Update `server/src/services/piperService.ts`:
   ```typescript
   const VOICE_MODEL = join(PIPER_DIR, 'models', 'your-voice-model.onnx');
   ```

Popular alternatives:
- `en_US-amy-medium` - Different female voice
- `en_US-ryan-high` - Male voice, higher quality
- `en_GB-*` - British accent voices
- Many other languages available!

## Technical Details

### How It Works

1. **Combined Audio Generation**: All script segments are combined into a single audio file
2. **Pause Insertion**: Natural pauses (`. . .`) are added between segments
3. **WAV Output**: Piper generates raw PCM audio, converted to WAV format
4. **Duration Estimation**: Based on word count (~160 words/minute)
5. **Segment Timing**: Calculated proportionally based on word counts

### Audio Format

- **Sample Rate**: 22050 Hz
- **Channels**: Mono
- **Bit Depth**: 16-bit
- **Format**: WAV (converted from raw PCM)

### Performance

Typical generation times on Render free tier:
- Short text (50 words): ~100-200ms
- Medium text (200 words): ~300-500ms
- Long text (500 words): ~1-2s

**Note**: Much faster than ElevenLabs API calls (which include network latency)!

## Troubleshooting

### "Piper TTS is not installed" Error

**Solution**: Run the setup script:
```bash
cd server
npm run setup-piper
```

### Piper Binary Not Found

**Check installation**:
```bash
ls server/piper/piper
ls server/piper/models/
```

**Reinstall if needed**:
```bash
rm -rf server/piper
npm run setup-piper
```

### Voice Model Missing

The setup script automatically downloads `en_US-lessac-medium`. If missing:
```bash
cd server/piper/models
curl -L "https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en_US-lessac-medium.onnx" -o en_US-lessac-medium.onnx
curl -L "https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en_US-lessac-medium.onnx.json" -o en_US-lessac-medium.onnx.json
```

### Audio Quality Issues

Try a higher quality voice model:
1. Download a `-high` quality model from [Piper Voices](https://github.com/rhasspy/piper/blob/master/VOICES.md)
2. Update the voice model path in `piperService.ts`
3. Rebuild the project

### Render Deployment Issues

**Build fails during Piper setup**:
- Check build logs in Render dashboard
- Ensure `scripts/setup-piper.sh` is executable
- Verify internet access during build (downloads ~50MB)

**Runtime errors on Render**:
- Verify `PIPER_DIR` environment variable is set correctly
- Check that model files were downloaded during build
- Look for permission issues in logs

## Cost Comparison

| Service | Cost | Latency | Quality |
|---------|------|---------|---------|
| **Piper TTS** | **FREE** | **~200ms** | **⭐⭐⭐⭐** |
| ElevenLabs | $30/1M chars | ~1-2s | ⭐⭐⭐⭐⭐ |
| OpenAI TTS | $15/1M chars | ~1-2s | ⭐⭐⭐⭐ |
| Google Cloud | $4-16/1M chars | ~1-2s | ⭐⭐⭐⭐ |

**Verdict**: Piper TTS is the best choice for most use cases, especially on free hosting!

## Advanced Usage

### Custom Voice Training

Piper supports custom voice training! See [Piper Training Guide](https://github.com/rhasspy/piper/blob/master/TRAINING.md)

### Multiple Languages

Download additional language models and switch based on input:
```typescript
const language = detectLanguage(text);
const modelPath = getModelForLanguage(language);
```

### Voice Effects

Piper supports SSML-like syntax for:
- Speaking rate adjustments
- Pitch modifications
- Pauses and breaks

See [Piper Documentation](https://github.com/rhasspy/piper) for details.

## Support

- **Piper GitHub**: https://github.com/rhasspy/piper
- **Piper Voices**: https://github.com/rhasspy/piper/blob/master/VOICES.md
- **Issues**: Open an issue in your project repository

## License

Piper TTS is licensed under the MIT License.

---

**Enjoy your free, fast, and private text-to-speech! 🎙️✨**

