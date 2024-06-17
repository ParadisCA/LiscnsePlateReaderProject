//Christian Paradis, CS 455, Spring 2024
//This project represents a DMV service that is constantly running
//The service looks for messages from a downward queue in the cloud
//Will then take that message use it to find information about the car owner and send that information back
//to the cloud via an upward queue, the message will then be deleted


//Imports and tools used
const {SQSClient,ReceiveMessageCommand,SendMessageCommand, DeleteMessageCommand} =require("@aws-sdk/client-sqs");
const process = require('process')
const fs = require('fs');
//var moment = require('moment')

//const logFileName = 'LocalService.log'
const client = new SQSClient()

//Unused log function
// function writeToLogFile(message) {
//     const timestamp = moment().format('YYYY-MM-DD hh:mm:ss')
//     let content = `${timestamp}:  ${message}\n`
//     fs.appendFile(logFileName, content, err => {
//         if (err) {
//           console.error(err);
//         } 
//     });
// }

//This function is a continously running function that polls and downward queue in the cloud
async function ReceiveMessage() {
    //Input to receive message from specified queue
    //Only allows one message to come through at a time
    var rinput = {
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/731220719584/Project3DownwardQueue",
        WaitTimeSeconds: 20,
        MaxNumberOfMessages:1
    }
    //Reading the "database"
    const file = fs.readFileSync("/Users/paradisc/CS455/Project3/FakeService/DMVDatabase.json");
    const dataBase = JSON.parse(file);
    const rcommand = new ReceiveMessageCommand(rinput);
    var sinput = {};
    try {
        //Sending command and receiving response(message)
        const msg = await client.send(rcommand);
        if("Messages" in msg){

        console.log(msg)
        //Finding mathcing liscense plate number in DMV data base
        const info = JSON.parse(msg.Messages[0].Body);
        for(var i = 0; i < dataBase.dmv.vehicle.length;i++) {
            if(dataBase.dmv.vehicle[i].plate == info.LiscensePlate) {
                console.log(dataBase.dmv.vehicle[i]);
                //Assigning input for msg back to cloud
                sinput = {
                    "DMVData" : dataBase.dmv.vehicle[i],
                    "VInfo" : info
                }
            }
        }
        var sinput2 = JSON.stringify(sinput);
        var sinputFinal = {
            QueueUrl : "https://sqs.us-east-1.amazonaws.com/731220719584/Project3UpwardQueue",
            MessageBody: sinput2
        }
        //Sending message back to cloud
        const scommand = new SendMessageCommand(sinputFinal);
        const response = await client.send(scommand);
        var dinput = {
            QueueUrl:"https://sqs.us-east-1.amazonaws.com/731220719584/Project3DownwardQueue",
            ReceiptHandle:  msg.Messages[0].ReceiptHandle,
        };
        //Deleting last message to be sure to no poll again
        const dcommand = new DeleteMessageCommand(dinput)
        const dresponse = await client.send(dcommand);
    }
    else {
        console.log("no msg");
    }
    } catch (err) {
        console.error(err);
    }
}


console.log(`==>> DMVService process id: ${process.pid}`)

// Run the ReceiveMessage every 5 seconds
setInterval(ReceiveMessage, 5000);
//ReceiveMessage();

