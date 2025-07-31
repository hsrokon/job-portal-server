const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfpheel.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const db = client.db('jobPortal');


    const jobsCollection = db.collection('jobs');

    app.get('/jobs', async(req, res)=> {

      const email = req.query.email;
      
      let query = {};
      if (email) {
        query = { hr_email : email };  
      }

      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/jobs', async(req, res)=> {
      const result = await jobsCollection.insertOne(req.body);
      res.send(result);
    })

    app.get('/jobs/:id', async(req, res)=> {
      const query = req.params.id;
      const filter = { _id : new ObjectId(query)};
      const result = await jobsCollection.findOne(filter);
      res.send(result);
    })



    const jobApplyCollection = db.collection('jobApplications');

    app.post('/jobs/apply', async(req, res) => {
      const applicationData = req.body;
      const result = await jobApplyCollection.insertOne(applicationData);
      res.send(result);
    })

    app.get('/jobs/apply', async(req, res)=> {
      const email = req.query.email;
      const query = { applicantEmail : email };
      const result = await jobApplyCollection.find(query).toArray();

      for( const application of result ) {
        const query1 = { _id : new ObjectId(application.jobId) };
        const job = await jobsCollection.findOne(query1)
        if (job) {
          application.jobTitle = job.title;
          application.company = job.company;
          application.location = job.location;
          application.companyLogo = job.company_logo;
        }
      }

      res.send(result);
    })



    



    




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', async(req, res)=> {

    res.send("Hi I'm Job-Portal Server")
})

app.listen(port, ()=> {
  console.log('Server running')})