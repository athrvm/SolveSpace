const express = require('express')
const app = express()

// require('dotenv').config({ path: './src/.env' }) // If inside src folder then use this.
require('dotenv').config() // If inside root folder then use this.
const main = require('./config/db') // Importing the database connection file
const redisClient = require('./config/redis') // Importing the redis connection file
const cookieParser = require('cookie-parser') // cookies come in json format and this middleware is used to parse the cookies into JavaScript objects.
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');
const aiRouter = require('./routes/aiChatting')
const videoRouter = require("./routes/videoCreator");

const cors = require('cors') // This is used to allow cross origin requests. i.e. frontend and backend are running on different ports. So we need to allow cross origin requests.

app.use(cors({
    origin: 'http://localhost:5173', // frontend url
    credentials: true, // This is used to allow cookies to be sent in cross origin requests.
}))

app.use(express.json()) // Middleware to parse JSON request bodies into JavaScript objects.
app.use(cookieParser()) // Middleware to parse cookies into JavaScript objects.

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/bookmarks', require('./routes/bookmark'));
app.use('/submission',submitRouter);
app.use('/chat',aiRouter);
app.use("/video",videoRouter);



const InitalizeConnection = async () => {
    try {

        await Promise.all([main(), redisClient.connect()]);
        console.log("All Databases Connected");

        app.listen(process.env.PORT, () => {
            console.log("Server listening at port number: " + process.env.PORT);
        })

    }
    catch (err) {
        console.log("Error: " + err);
    }
}
InitalizeConnection();