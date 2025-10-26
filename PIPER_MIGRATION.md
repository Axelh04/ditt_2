# Piper TTS Migration Summary

This document summarizes the migration from ElevenLabs to Piper TTS as the default text-to-speech provider.

## 🎯 What Changed

### New Files Created

1. **`server/src/services/piperService.ts`**
   - New service for Piper TTS integration
   - Handles text-to-speech generation using Piper
   - Converts raw PCM audio to WAV format
   - Calculates audio segments based on word counts

2. **`server/scripts/setup-piper.sh`**
   - Automatic installation script for Piper TTS
   - Downloads appropriate binary for OS/architecture
   - Downloads `en_US-lessac-medium` voice model
   - Runs during build phase on Render

3. **`TTS_SETUP.md`**
   - Complete documentation for TTS configuration
   - Instructions for using Piper or ElevenLabs
   - Troubleshooting guide
   - Voice model information

4. **`PIPER_MIGRATION.md`** (this file)
   - Summary of changes for the migration

### Modified Files

1. **`server/src/routes/voiceover.ts`**
   - Added logic to choose between Piper and ElevenLabs
   - Defaults to Piper TTS (free)
   - Falls back to ElevenLabs if `TTS_PROVIDER=elevenlabs`

2. **`server/package.json`**
   - Added `setup-piper` script for easy installation

3. **`render.yaml`**
   - Updated build command to include Piper setup
   - Added `TTS_PROVIDER=piper` environment variable
   - Added `PIPER_DIR` environment variable

4. **`README.md`**
   - Updated features to mention Piper TTS
   - Updated prerequisites (ElevenLabs now optional)
   - Added setup instructions for Piper
   - Added link to TTS_SETUP.md

5. **`RENDER_DEPLOYMENT.md`**
   - Updated deployment instructions
   - Made ElevenLabs API key optional
   - Added Piper TTS troubleshooting section
   - Updated environment variables reference

## 🚀 Benefits

### Cost Savings
- **Before**: ~$30 per 1M characters with ElevenLabs
- **After**: $0 (completely free with Piper TTS)

### Performance
- **Before**: ~1-2 seconds (includes API call latency)
- **After**: ~100-500ms (local generation, no network calls)

### Privacy
- **Before**: Text sent to ElevenLabs servers
- **After**: All processing done locally

### Deployment
- **Before**: Required ElevenLabs API key
- **After**: Works out-of-the-box on Render free tier

## 📋 Testing Checklist

### Local Testing

1. **Install Piper TTS**:
   ```bash
   cd server
   npm run setup-piper
   ```

2. **Verify Installation**:
   ```bash
   ls -la piper/
   # Should see: piper binary and models/ directory
   ls -la piper/models/
   # Should see: en_US-lessac-medium.onnx and .json files
   ```

3. **Start Backend**:
   ```bash
   npm run dev
   ```

4. **Test TTS Endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/voiceover/generate \
     -H "Content-Type: application/json" \
     -d '{"scripts": ["Hello from Piper TTS!", "This is a test."]}'
   ```

5. **Verify Console Output**:
   - Should see: "🎙️ Using Piper TTS (FREE)"
   - Should see audio segments logged
   - Should receive base64 audio in response

### Render Deployment Testing

1. **Push Changes**:
   ```bash
   git add .
   git commit -m "Migrate to Piper TTS for free, low-latency TTS"
   git push
   ```

2. **Monitor Build Logs**:
   - Watch for "🔧 Setting up Piper TTS..."
   - Verify Piper binary download (~30MB)
   - Verify voice model download (~20MB)
   - Check for "✅ Piper TTS is working correctly!"

3. **Test Deployed App**:
   - Submit a process request
   - Verify voiceover generation works
   - Check backend logs for "🎙️ Using Piper TTS (FREE)"

## 🔄 Switching Between Providers

### Use Piper TTS (Default)

**Local**:
```bash
# In server/.env
TTS_PROVIDER=piper
```

**Render**:
- Set environment variable: `TTS_PROVIDER=piper`

### Use ElevenLabs

**Local**:
```bash
# In server/.env
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_api_key
```

**Render**:
- Set environment variable: `TTS_PROVIDER=elevenlabs`
- Set environment variable: `ELEVENLABS_API_KEY=your_api_key`

## 🐛 Troubleshooting

### "Piper TTS is not installed" Error

**Local Development**:
```bash
cd server
npm run setup-piper
```

**Render Deployment**:
1. Check build logs for Piper setup errors
2. Verify `scripts/setup-piper.sh` is executable: `chmod +x scripts/setup-piper.sh`
3. Ensure build command includes: `bash scripts/setup-piper.sh`

### Audio Quality Lower Than Expected

Try a higher quality voice model:
```bash
cd server/piper/models
# Download high quality model
curl -L "https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en_US-lessac-high.onnx" -o en_US-lessac-high.onnx
curl -L "https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-en_US-lessac-high.onnx.json" -o en_US-lessac-high.onnx.json
```

Then update `server/src/services/piperService.ts`:
```typescript
const VOICE_MODEL = join(PIPER_DIR, 'models', 'en_US-lessac-high.onnx');
```

### Render Build Takes Longer

This is normal! First build downloads:
- Piper binary (~30MB)
- Voice model (~20MB)

Subsequent builds use cache and are faster.

### Want to Revert to ElevenLabs

Simply set the environment variable:
```bash
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_key
```

No code changes needed!

## 📊 Comparison

| Aspect | Piper TTS | ElevenLabs |
|--------|-----------|------------|
| Cost | **FREE** | $30/1M chars |
| Latency | **~200ms** | ~1-2s |
| Quality | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Privacy | ✅ Local | ❌ Cloud |
| Setup | Script | API Key |
| Voices | 100+ (download) | 30+ (built-in) |
| Languages | 50+ | 30+ |
| Customization | Voice training | Voice cloning ($) |

## 🎉 Success Metrics

After successful deployment, you should see:
- ✅ No TTS-related costs
- ✅ Faster audio generation
- ✅ Works on Render free tier
- ✅ No API key management for TTS
- ✅ Same user experience

## 📚 Additional Resources

- [TTS_SETUP.md](./TTS_SETUP.md) - Complete TTS configuration guide
- [Piper GitHub](https://github.com/rhasspy/piper) - Official Piper repository
- [Piper Voices](https://github.com/rhasspy/piper/blob/master/VOICES.md) - Available voice models
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Deployment guide

## 🤝 Support

If you encounter any issues:
1. Check [TTS_SETUP.md](./TTS_SETUP.md) troubleshooting section
2. Review Render build logs
3. Test locally with `npm run setup-piper`
4. Fallback to ElevenLabs if needed

---

**Migration Complete! 🎊**

You now have a free, fast, and privacy-friendly TTS solution!

