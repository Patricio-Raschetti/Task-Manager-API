// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;
// const ObjectID = mongodb.ObjectID;

const { MongoClient, ObjectID } = require('mongodb');

const connectionURL = 'mongodb://127.0.0.1:27017';
const dbName = 'task-manager';

MongoClient.connect(connectionURL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
    if (error) {
        return console.log('Could not connect to the DB!', error);
    };

    const db = client.db(dbName);
    
    const users = db.collection('users');
    const tasks = db.collection('tasks');

    // users.updateOne({_id: new ObjectID("5dfc2a856698f068565f5c5b")}, {
    //     $set: {
    //         name: 'Testing document'
    //     },
    //     $inc: {
    //         age: 10
    //     }
    // }).then((result) => {
    //     console.log(result);
    // }).catch((error) => {
    //     console.log(error);
    // });

    tasks.updateMany({completed: false}, {
        $set: {
            completed: true
        }
    }).then((result) => {
        console.log(result.modifiedCount, result.matchedCount);
    }).catch((error) => {
        console.log(error);
    });
});
