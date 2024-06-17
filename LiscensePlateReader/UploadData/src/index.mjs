//Christian Paradis, CS 455, Spring 2024
//This application sends an liscense plate image to an S3 bucket


//Importing S3 client and the PutObjectCommand to add objects to S3 Bucket
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
//Importing fs to read the JSON files
import fs from 'node:fs';
//Importing path to get the file name to be used as key in PutItemCommand
import path from 'node:path';
//declaring const S3 client
const s3client = new S3Client({});
//Getting file path from command line arguments
var arg = process.argv;
//Reading the image file
var obj = fs.readFileSync(arg[arg.length-4]);
//getting violation,address and date/time
var violation = arg[arg.length-3];
var address = arg[arg.length-2];
var dateTime = arg[arg.length-1];
//Getting the file name
var fileName = path.basename(arg[arg.length-4]);
console.log(fileName);
//If proper violation creates a s3object with metadata to send to cloud
if(violation == "no_stop" || violation == "no_full_stop_on_right" || violation == "no_right_on_red"){
    const input = {
        "Body": obj ,
        "Bucket": "christianp-cs455-project3bucket",
        "Key": fileName,
        "Metadata": {
            "Violation":violation,
            "Address":address,
            "DateTime":dateTime
        }
    };
    //Sending object to cloud
    const command = new PutObjectCommand(input);
    const response = await s3client.send(command);
    console.log(response);
    }
else {
    console.log("Invalid Input")
}    
