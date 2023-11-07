const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hiprwon.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const assignmentCollection = client.db('groupStudy').collection('assignments');
        const myAssignmentCollection = client.db('groupStudy').collection('myAssignments');

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

        app.get('/assignment/update/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.findOne(query);
            res.send(result);
        })

        app.put('/assignment/update/:id', async (req, res) => {
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

        app.post('/myAssignment', async (req, res) => {
            const assignment = req.body;
            console.log(assignment);
            const result = await myAssignmentCollection.insertOne(assignment);
            res.send(result);
        });

        app.get('/myAssignment', async (req, res) => {
            const cursor = myAssignmentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/myAssignment/filter', async (req, res) => {
            const { status } = req.query; // Get the 'status' query parameter

            const query = { status: status }
            const result = await myAssignmentCollection.find(query).toArray();
            // console.log(result, status);

            res.json(result);
        });

        app.put('/myAssignment/:id', async (req, res) => {
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

        app.patch('/myAssignment/markUpdate/:id', async (req, res) => {
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

        app.delete('/myAssignment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await myAssignmentCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
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