//Christian Paradis, CS 455, Spring 2024
//This Lambda function polls the SQS upwardqueue and takes that message
//and sends a ticket using information from queue
//An error where longpolling from lambda sends many empty messages to this function


export const handler = async (event) => {
    for (const { messageId, body } of event.Records) {
      if (body != '{}') {
        const message = JSON.parse(body);
        console.log(message);
        var fineAmount = 0;
        //Violation type
        if (message.VInfo.Violation == "no_stop") {
          fineAmount = 300.00;
        }
        else if (message.VInfo.Violation == "no_full_stop_on_right") {
          fineAmount = 75.00;
        }
        else {
          fineAmount = 125.00;
        }
        //Final message sent to cloudwatch
        console.log("Your vehicle was involved in a traffic violation. Please pay the specified ticket amount by 30 days: \nVehicle: " + message.DMVData.color + " " + message.DMVData.make + " " + message.DMVData.model + "\nLiscense plate: " + message.DMVData.plate + "\nDate: " + message.VInfo.DateTime + "\nViolation address: " + message.VInfo.Address + "\nViolation type: " + message.VInfo.Violation + "\nTicket amount: $" + fineAmount);
      }
    }
  };