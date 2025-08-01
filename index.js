const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173'], // setting on server only accept req from this url
  credentials: true //allowing cookies handle || this is necessary to set cookie
}));
app.use(express.json());
app.use(cookieParser());// it processes the requested cookie and make it an object


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


    //auth related api's
    app.post('/jwt', async(req, res)=> {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : '5h' });
      res
      .cookie('token', token, {
        httpOnly : true, 
        secure : false,  //http://localhost:5173/logIn || in production make it true as req will be made https://
      })
      .send({success : true})
    })


    const db = client.db('jobPortal');

    const jobApplyCollection = db.collection('jobApplications');

    app.post('/jobs/apply', async(req, res) => {
      const applicationData = req.body;
      const result = await jobApplyCollection.insertOne(applicationData);

      //job application count update
      const jobId = applicationData.jobId;
      const query = { _id : new ObjectId(jobId) };
      const job = await jobsCollection.findOne(query);
      let count =0;
      if (job.applicationCount) {
          count = job.applicationCount + 1;
      } else {
        count = 1;
      }
      const updatedJob = {
        $set : {
          applicationCount : count
        }
      }
      const result1 = await jobsCollection.updateOne(query, updatedJob);
      // console.log(result1);
      res.send(result);
    })

    app.get('/jobs/apply/myJobApplied/:id', async(req, res)=> {
      const query = { jobId : req.params.id };
      const result = await jobApplyCollection.find(query).toArray();
      res.send(result);
    })

    app.patch('/jobs/apply/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id) };
      const updateField = {
        $set : {
          status : req.body.status,
        }
      }

      const result = await jobApplyCollection.updateOne(query, updateField)
      res.send(result);

    })

    app.get('/jobs/apply', async(req, res)=> {
      const email = req.query.email;
      const query = { applicantEmail : email };

      //cookie parser automatic set cookies in req.cookies
      console.log('cookies', req.cookies);
      

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