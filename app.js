const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const uri = 'mongodb+srv://jpg:jpg2024@cluster0.vh5eyep.mongodb.net/';
const client = new MongoClient(uri);


async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Terminate the application if unable to connect to the database
    }
}

connectToDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const usersCollection = client.db('raspberryPi').collection('Accounts');

    try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Insert the new user into the database
        const result = await usersCollection.insertOne({ email, password });
        console.log('User signed up:', result.insertedId);
        res.redirect('/adduser'); // Redirect to adduser page after successful signup
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ message: 'Sign-up failed' });
    }
});

app.get('/adduser', (req, res) => {
    res.sendFile(path.join(__dirname, 'adduser.html'));
});

// Modified startTraining function to return a promise
async function startTraining() {
    try {
        const flagValue = true;
        const appConfigCollection = client.db('raspberryPi').collection('appConfig');
        const updateResult = await appConfigCollection.updateOne(
            { id: 'addUser' },
            { $set: { flag: flagValue } }
        );
        console.log('Update result:', updateResult);
        if (updateResult.modifiedCount === 1) {
            console.log('Flag updated successfully');
            return true; // Resolve the promise if flag is updated successfully
        } else {
            console.error('Failed to update flag');
            return false; // Reject the promise if flag update fails
        }
    } catch (error) {
        console.error('Error updating flag:', error);
        throw error; // Throw error to be caught by the caller
    }
}

app.post('/adduser', async (req, res) => {
    const { Fname, Number } = req.body;

    // Check if Fname and Number are provided
    if (!Fname || !Number) {
        return res.status(400).json({ message: 'First name and phone number are required' });
    }

    const usersCollection = client.db('raspberryPi').collection('Users');

    try {
        // Count the number of existing users in the database
        const userCount = await usersCollection.countDocuments();

        // Insert the new user into the database
        const result = await usersCollection.insertOne({ Fname, Number, Label: userCount + 1 });
        console.log('User added:', result.insertedId);

        // Proceed to start training
        await startTraining();

        // Redirect to home page after successful addition and training
        console.log('Redirecting to /home');
        res.redirect('/home');
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Failed to add user' });
    }
});

app.post('/controlsensor', async (req, res) => {
    try {
        const flagValue = req.body.flag;
        console.log('Flag value received for controlling sensor:', flagValue);

        // Update the flag value in the sensorConfig collection
        const sensorConfigCollection = client.db('raspberryPi').collection('sensorConfig');
        const updateResult = await sensorConfigCollection.updateOne(
            { id: 'stopSensor' }, // Filter by the desired ID
            { $set: { flag: flagValue } } // Set the flag field
        );

        console.log('Sensor control update result:', updateResult);

        if (updateResult.modifiedCount === 1) {
            console.log('Sensor control flag updated successfully');
            res.sendStatus(200);
        } else {
            console.error('Failed to update sensor control flag');
            res.sendStatus(500);
        }
    } catch (error) {
        console.error('Error controlling sensor:', error);
        res.sendStatus(500);
    }
});



// Additional routes...
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'history.html'));
});

app.get('/manageuser', (req, res) => {
    res.sendFile(path.join(__dirname, 'manageuser.html'));
});


// API endpoint to fetch users
app.get('/api/users', async (req, res) => {
    try {
        const usersCollection = client.db('raspberryPi').collection('Users');
        const users = await usersCollection.find().toArray();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// API endpoint to delete a user
app.delete('/api/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const usersCollection = client.db('your_database_name').collection('Users');
        const objectId = new ObjectId(userId);
        const result = await usersCollection.deleteOne({ _id: objectId });
        if (result.deletedCount === 1) {
            res.sendStatus(200);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
