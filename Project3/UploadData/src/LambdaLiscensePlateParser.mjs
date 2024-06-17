//Christian Paradis, CS455, Spring 2024
//This function uses amazon Rekognition to parse Lisencse plate
//The liscense plate is then sent to an downwardQueue if the plate if form california
//If not the plate is sent to an Eventbridge for further processing


//Imports and tools used
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
const s3client = new S3Client({ region: "us-east-1" });
import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";
const rclient = new RekognitionClient({ region: "us-east-1" });
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
const sqsclient = new SQSClient({ region: "us-east-1" });
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
const ebclient = new EventBridgeClient({ region: "us-east-1" });

export const handler = async (event) => {


    //Must have records to intiate trigger
    if (event.Records.length > 0) {
        const record = event.Records[0];
        const objectKey = record.s3.object.key;
        const bucketName = record.s3.bucket.name;
        //Placing the bucket name and key of the most prevous object into this params variable
        //Getting the object using GetObjectCommand from s3 aws
        const input = {
            Image: {
                //   Bytes: new Uint8Array(),
                S3Object: {
                    Bucket: bucketName,
                    Name: objectKey
                }
            }
        };
        //Regular expression for liscense plate
        const re = new RegExp("^(?=.*[0-9])(?=.*[A-Z])[A-Z_0-9]{6,7}$")
        const command = new DetectTextCommand(input);
        const response = await rclient.send(command);
        console.log(response);
        var isCal = false;
        var liscensePlate = "undetected";
        //Checking if plate is from california
        for (var i = 0; i < response.TextDetections.length; i++) {
            if (response.TextDetections[i].DetectedText == "California") {
                isCal = true;
                break;
            }
        }
        var params = {
            Bucket: bucketName,
            Key: objectKey
        };
        //Getting metadata from S3object
        const s3command = new GetObjectCommand(params);
        const s3response = await s3client.send(s3command);
        var dateTime = s3response.Metadata.datetime;
        var violation = s3response.Metadata.violation;
        var address = s3response.Metadata.address;
        console.log(dateTime + "  " + violation + " " + address);
        //Getting liscense plate
        for (var i = 0; i < response.TextDetections.length; i++) {
            if (re.test(response.TextDetections[i].DetectedText))  {
                liscensePlate = response.TextDetections[i].DetectedText;
                break;
            }
        }
        var plateFound = false;
        console.log(liscensePlate);
        //If plate was not found in last step, this nested loop checks again in more detail
        if (liscensePlate == "undetected"){
            for(var k = 0; k < response.TextDetections.length; k++) {
                for(var j = 0; j < response.TextDetections.length; j++) {
                    if(k!=j && response.TextDetections[k].DetectedText != response.TextDetections[j].DetectedText) {
                        if(re.test(response.TextDetections[k].DetectedText+response.TextDetections[j].DetectedText)){
                            liscensePlate = response.TextDetections[k].DetectedText+response.TextDetections[j].DetectedText;
                            plateFound = true;
                            break;
                        }
                        
                    }
                }
                if(plateFound){
                    break
                }
            }
        }
        console.log(liscensePlate)
        var msgObj = { LiscensePlate: liscensePlate, DateTime: dateTime, Violation: violation, Address: address };
        var msgStr = JSON.stringify(msgObj);
        //Sending msg to Downward Queue if a california plate
        if (isCal) {
            var msg = {
                QueueUrl: "https://sqs.us-east-1.amazonaws.com/731220719584/Project3DownwardQueue",
                MessageBody: msgStr
            }

            const sqsCommand = new SendMessageCommand(msg);
            const sqsresponse = await sqsclient.send(sqsCommand);
            console.log(sqsresponse);
        }
        else {
            //Sending msg to eventbridge for furhter processing if not california plate
            const sqsinput = {
                Entries: [{
                    Source: "aws:lambda",
                    DetailType: "OutOfStateLiscensePlate",
                    Detail: msgStr,
                    EventBusName: "default",
                }, ],
            };

            const ebCommand = new PutEventsCommand(sqsinput);
            const ebresponse = await ebclient.send(ebCommand);
            console.log(ebresponse);
        }
    }
}
