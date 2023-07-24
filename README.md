# Email Auto-Responder - Readme

## Introduction
This project is a Node.js application that automates the process of replying to unread emails in your Gmail account. It utilizes the Gmail API from Google and runs as a server with the help of Express.js. The application uses OAuth2 for authentication to access your Gmail account securely. The server is set up to listen to incoming requests and respond with appropriate actions.

## Prerequisites
Before using this application, you need to have the following:

1. Node.js installed on your machine.
2. A Gmail account (sender account) from which you want to automate email replies.
3. A Google Cloud Platform (GCP) project with Gmail API enabled, and API credentials generated. You will need the Client ID, Client Secret, and Redirect URI from the GCP project.

## Setup

1. Clone the repository to your local machine:
   ```
   git clone https://github.com/singh1203/Gmail_Autoresponse.git
   ```

2. Navigate to the project directory:
   ```
   cd Gmail_Autoresponse
   ```

3. Install the required dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory of the project and add the following information:
   ```
   CLIENT_ID=<your-gcp-client-id>
   CLIENT_SECRET=<your-gcp-client-secret>
   REDIRECT_URI=<your-redirect-uri>
   PORT=<port-number>
   ```

5. Replace `<your-gcp-client-id>`, `<your-gcp-client-secret>`, and `<your-redirect-uri>` with the credentials from your GCP project. Set `<port-number>` to the port on which you want the server to run (default is 3000).

## Usage

1. After setting up the application, run the server using the following command:
   ```
   npm start
   ```

2. Access the server in your web browser or use a tool like Postman to initiate the authentication process. This will redirect you to a Google login page, where you need to provide access to your Gmail account.

3. Once the authentication is successful, the server will start a cron job that runs every 45 seconds by default (you can modify the cron schedule if needed). The cron job will fetch new unread emails, check if they have prior replies by you, and send a reply if needed.

## How It Works

The application works by setting up a cron job that runs at specified intervals (every 45 seconds by default). The cron job fetches a list of unread emails from your Gmail account using the Gmail API. For each unread email, it checks if there are any prior replies by you in the email thread. If there are no prior replies, it sends a pre-defined reply and adds a label to the email thread to categorize it as "To be reviewed."

The server uses OAuth2 for authentication, ensuring secure access to your Gmail account without exposing your credentials directly.

Please note that the application will only send automated replies to emails for which you haven't replied before, to avoid sending duplicate responses to the same email thread.

## Customization

You can customize the reply message and the label name by modifying the `sendReply()` and `addLabelAndMoveEmail()` functions in the code.

## Conclusion

This project demonstrates how to automate email replies using the Gmail API and Node.js. It can be useful for scenarios where you want to acknowledge receipt of emails or inform senders about your absence. Feel free to extend and modify the code to suit your specific use case.

If you encounter any issues or have suggestions for improvements, please feel free to contribute or reach out for support.

Happy automating!
