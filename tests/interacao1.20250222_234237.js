// API endpoints
const app = express();

app.get('/ping', (req, res) => {
    res.status(200).json({ message: 'pong' });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});