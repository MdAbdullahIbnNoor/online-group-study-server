const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors({
    origin: ['https://online-group-study.web.app', 'https://online-group-study.firebaseapp.com'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hiprwon.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);
    // no token available 
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const assignmentCollection = client.db('groupStudy').collection('assignments');
        const myAssignmentCollection = client.db('groupStudy').collection('myAssignments');

        // jwt authorization
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // crud operation
        app.get('/assignment', async (req, res) => {
            const cursor = assignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/assignment', async (req, res) => {
            const assignment = req.body;
            console.log(assignment);
            const result = await assignmentCollection.insertOne(assignment);
            res.send(result);
        });

        app.get('/assignment/update/:id',logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        app.put('/assignment/update/:id',logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedAssignment = req.body;

            const assignmentUpdates = {
                $set: {
                    title: updatedAssignment.title,
                    description: updatedAssignment.description,
                    marks: updatedAssignment.marks,
                    difficultyLevel: updatedAssignment.difficultyLevel,
                    dueDate: updatedAssignment.dueDate,
                    photoURL: updatedAssignment.photoURL,
                }
            };

            try {
                const result = await assignmentCollection.updateOne(filter, assignmentUpdates);
                res.send(result);

            } catch (error) {
                console.error('Error updating assignment:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        app.delete('/assignment/:id',logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/myAssignment', logger, verifyToken, async (req, res) => {
            const assignment = req.body;
            console.log(assignment);
            const result = await myAssignmentCollection.insertOne(assignment);
            res.send(result);
        });

        app.get('/myAssignment', logger, verifyToken, async (req, res) => {
            const cursor = myAssignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/myAssignment/filter', logger, verifyToken, async (req, res) => {
            const { status } = req.query; // Get the 'status' query parameter

            const query = { status: status }
            const result = await myAssignmentCollection.find(query).toArray();
            // console.log(result, status);

            res.json(result);
        });

        app.get('/myAssignment/filterbyemail', logger, verifyToken, async (req, res) => {
            const { email } = req.query; // Get the 'status' query parameter

            const query = { submittedBy: email }
            const result = await myAssignmentCollection.find(query).toArray();
            // console.log(result, email);

            res.json(result);
        });

        app.put('/myAssignment/:id', logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedAssignment = req.body;

            const assignmentUpdates = {
                $set: {
                    title: updatedAssignment.title,
                    description: updatedAssignment.description,
                    marks: updatedAssignment.marks,
                    difficultyLevel: updatedAssignment.difficultyLevel,
                    dueDate: updatedAssignment.dueDate,
                    photoURL: updatedAssignment.photoURL,
                    status: updatedAssignment.status,
                    pdfLink: updatedAssignment.pdfLink,
                    additionalText: updatedAssignment.additionalText,
                    submittedBy: updatedAssignment.submittedBy
                }
            };

            try {
                const result = await assignmentCollection.updateOne(filter, assignmentUpdates);
                res.send(result);

            } catch (error) {
                console.error('Error updating assignment:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        })

        app.patch('/myAssignment/markUpdate/:id',logger, verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedAssignment = req.body;
            console.log(updatedAssignment);
            const updateDoc = {
                $set: {
                    status: updatedAssignment.status,
                    markGiven: updatedAssignment.markGiven,
                    feedBack: updatedAssignment.feedBack,
                },
            };
            const result = await myAssignmentCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is listening at ${port}`);
});


// app.get('/assignment', async (req, res) => {
//     const cursor = assignmentCollection.find();
//     const result = await cursor.toArray();
//     res.send(result);
// });