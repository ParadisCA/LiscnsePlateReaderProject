This project reads a liscense plate that is uploaded into an S3 bucket in the AWS cloud. The liscense plate is then read using AWS rekognition.
If the liscense plate is a california plate, the plate will then be sent to An SQS queue which then be read by FAKESERVICE. This will then get info from a 
DMV JSON file and send the info back into the cloud via another SQS queue. This will then trigger another lambda function which sends a fake ticket to the person associated with that liscense plate in data base.
If not a california plate, the plate will be sent to an evenbridge bus to be filtered on a rule of "OutOfState" where the plate is sent to and SQS queue for further processing
