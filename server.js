const app = require('./src/app');

const connectDB = require('./src/db/database');
connectDB();

app.listen(3000, () => {
    console.log("server running on port 3000");
});