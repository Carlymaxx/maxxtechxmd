# MAXX-XMD WhatsApp Bot Pairing Guide

## Overview

This guide explains how to use the new pairing dashboard to link your WhatsApp account and get a Session ID for your MAXX-XMD bot.

## What is Pairing?

Pairing is a secure way to link your WhatsApp account to the bot without scanning QR codes. Instead, you:
1. Enter your phone number
2. Receive an 8-digit verification code via WhatsApp
3. Enter the code to create your session
4. Get your Session ID sent to your WhatsApp

## How to Use the Pairing Dashboard

### Step 1: Access the Pairing Dashboard

1. Start your Next.js development server:
   ```bash
   bun dev
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/pair
   ```

   Or click the "Create New Session" button on the main dashboard.

### Step 2: Enter Your Phone Number

1. Enter your WhatsApp phone number with country code
   - **Format**: Numbers only, no spaces or special characters
   - **Example**: `254100638635` (for +254 100 638635)
   - **Do NOT include**: `+` or spaces

2. Click "Send Verification Code"

3. Wait for the confirmation message

### Step 3: Check Your WhatsApp

You will receive a message like this:

```
🔐 MAXX-XMD VERIFICATION CODE

Your verification code is: 12345678

This code will expire in 10 minutes.

⚠️ Do not share this code with anyone.
```

### Step 4: Enter the Verification Code

1. Copy the 8-digit code from your WhatsApp
2. Enter it in the verification code field
3. Click "Verify & Create Session"

### Step 5: Get Your Session ID

After successful verification, you will:

1. See a success message on the dashboard
2. Receive your Session ID via WhatsApp:

```
✅ MAXX-XMD SESSION CREATED!

📱 Your Session ID:
MAXX-XMD-ABC12345

⚠️ IMPORTANT:
• Keep this Session ID private
• Use it to connect your bot
• Valid for 24 hours

🔐 To use this session, add it to your config:
SESSION_ID: "MAXX-XMD-ABC12345"
```

3. See the Session ID displayed on the dashboard (you can copy it)

## Using Your Session ID

### Option 1: Add to config.env

1. Open your `config.env` file
2. Find the `SESSION_ID` line
3. Replace it with your new Session ID:
   ```env
   SESSION_ID=MAXX-XMD-ABC12345
   ```

### Option 2: Use Environment Variable

Set the Session ID as an environment variable:

```bash
export SESSION_ID="MAXX-XMD-ABC12345"
```

## Starting the Bot with Your Session

After adding your Session ID:

```bash
# Start the bot server
bun bot

# Or start both Next.js and bot
bun dev  # Terminal 1
bun bot  # Terminal 2
```

## Troubleshooting

### "Invalid phone number" Error

- Make sure you're using only digits (0-9)
- Include your country code
- Remove any spaces, dashes, or the `+` symbol
- Example: `254100638635` not `+254 100 638 635`

### "No verification code found" Error

- Request a new code by going back to Step 1
- Make sure you're using the same phone number
- Codes expire after 10 minutes

### "Invalid verification code" Error

- Double-check the code from your WhatsApp
- Make sure you copied all 8 digits
- Request a new code if it expired

### "Failed to send verification code" Error

- Make sure the bot is connected and running
- Check that you have an active internet connection
- Verify the phone number is correct and has WhatsApp

### "Verification code has expired" Error

- Codes are valid for 10 minutes only
- Go back and request a new code

## Security Notes

⚠️ **IMPORTANT SECURITY INFORMATION**

1. **Never share your Session ID** with anyone
2. **Never commit your Session ID** to public repositories
3. **Keep your verification codes private**
4. **Session IDs expire after 24 hours** for security
5. **One Session ID per WhatsApp number** at a time

## API Endpoints

If you want to integrate the pairing system into your own application:

### Generate Verification Code

```http
POST /api/pair/generate
Content-Type: application/json

{
  "number": "254100638635"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your WhatsApp!"
}
```

### Verify Code and Create Session

```http
POST /api/pair/verify
Content-Type: application/json

{
  "number": "254100638635",
  "code": "12345678"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "MAXX-XMD-ABC12345",
  "message": "Session created successfully! Session ID has been sent to your WhatsApp."
}
```

## Technical Details

### How It Works

1. **Code Generation**: When you request a code, the system generates a random 8-digit number
2. **WhatsApp Delivery**: The code is sent to your WhatsApp using the Baileys library
3. **Code Storage**: The code is stored temporarily (10 minutes) in memory
4. **Verification**: When you submit the code, it's checked against the stored value
5. **Session Creation**: A new Baileys session is created with a unique Session ID
6. **Session Delivery**: The Session ID is sent to your WhatsApp and displayed on the dashboard

### Session Storage

- Sessions are stored in the `sessions/` directory
- Each session has its own folder named after the Session ID
- Session data includes authentication credentials and connection state

### Code Expiration

- Verification codes expire after **10 minutes**
- Expired codes are automatically cleaned up every 5 minutes
- You can request a new code at any time

## FAQ

**Q: Can I create multiple sessions?**
A: Yes, you can create multiple sessions for different WhatsApp numbers.

**Q: How long is my Session ID valid?**
A: Session IDs are valid for 24 hours. After that, you'll need to create a new session.

**Q: Can I use the same Session ID on multiple devices?**
A: No, each Session ID is tied to a specific device and WhatsApp account.

**Q: What happens if I lose my Session ID?**
A: You'll need to create a new session using the pairing dashboard.

**Q: Is this method secure?**
A: Yes, the verification code is sent directly to your WhatsApp, ensuring only you can create a session for your number.

**Q: Can I automate the pairing process?**
A: Yes, you can use the API endpoints to integrate pairing into your own applications.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console/terminal for error messages
3. Make sure your bot is connected and running
4. Verify your internet connection is stable

## Next Steps

After successfully pairing your bot:

1. ✅ Test the bot by sending messages to your WhatsApp
2. ✅ Try the available bot commands (`.menu`, `.ping`, etc.)
3. ✅ Explore the main dashboard at `http://localhost:3000`
4. ✅ Send messages programmatically using the dashboard

---

**Happy Botting! 🤖**
