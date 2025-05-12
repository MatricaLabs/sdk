// api.ts
import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Matrica OAuth Callback Server');
});

// This endpoint will receive the code after user authorization
app.get('/callback', (req, res) => {
    const { code, state } = req.query; // Extract code and state from query params
    console.log('--- Callback Received ---');
    if (code) {
        console.log('Authorization Code:', code);
        // In a real app, you'd store this code temporarily
        // or immediately exchange it for tokens if possible.
    } else {
        console.log('Callback received without code.');
    }
    if (state) {
        console.log('State:', state);
    }
    console.log('-------------------------');
    res.send('Callback received. Check your server logs for the code. You can close this tab.');
});

app.listen(PORT, () => {
    console.log(`Callback server listening on http://localhost:${PORT}`);
    console.log(`Callback URL: http://localhost:${PORT}/callback`);
});
