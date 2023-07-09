const express = require("express");
const { google } = require('googleapis');
const cron = require('node-cron');
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Redirect to authentication URL
app.get("/", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://mail.google.com/']
  });

  res.redirect(authUrl);
});

// OAuth2 callback route
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange authorization code for access token
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Start the cron job after successful authentication
    startCronJob();
    
    res.send("Authentication successful! Cron job started.");
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send("Error retrieving access token");
  }
});

// Function to start the cron job
function startCronJob() {
  cron.schedule('*/45 * * * * *', async () => {
    try {
      const auth = oAuth2Client;
      await retrieveAndReplyToEmails(auth);
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
}

// Function to retrieve new emails, reply to them, and add labels
async function retrieveAndReplyToEmails(auth) {
  try {
    const gmail = google.gmail({ version: 'v1', auth });

    // Fetch list of unread emails
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
    });

    const messages = res.data.messages;

    // Process each unread email
    for (const message of messages) {
      const messageId = message.id;
      const threadId = message.threadId;

      // Fetch the complete email message
      const messageRes = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      const email = messageRes.data;

      // Check if the email thread has prior replies by you
      const hasPriorReplies = await checkPriorReplies(gmail, threadId);

      if (!hasPriorReplies)  //&& email.payload.headers.find(header => header.name === 'From').value === 'Saurabh Singh <singh1203.ss@gmail.com>') 
      {
        // Process the email and send a reply
        await sendReply(gmail, email);

        // Add label and move the email to the labeled category
        await addLabelAndMoveEmail(gmail, threadId, 'To be reviewed');
      }
    }
  } catch (error) {
    console.error('Error retrieving and replying to emails:', error);
  }
}

// Function to check if the email thread has prior replies by you
async function checkPriorReplies(gmail, threadId) {
  try {
    // Fetch the list of emails in the thread
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    const thread = res.data;

    // Check if there are any replies by you in the thread
    const messages = thread.messages;
    const hasPriorReplies = messages.some(message => message.labelIds.includes('SENT'));

    return hasPriorReplies;
  } catch (error) {
    console.error('Error checking prior replies:', error);
    return true; // Assuming an error indicates prior replies to be safe
  }
}

// Function to send a reply
async function sendReply(gmail, email) {
  try {
    // Compose your reply email
    const replyEmail = {
      to: email.payload.headers.find(header => header.name === 'From').value,
      subject: "Reply from Saurabh Kumar Singh!",
      body: "Hello, this is Saurabh's automated response system, and I apologize for my absence,I will respond by email as soon as I return. Thank you.",
    };

    // Send the reply email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: createRawEmail(replyEmail),
        threadId: email.threadId,
      },
    });

    console.log('Reply sent successfully!');
  } catch (error) {
    console.error('Error sending reply:', error);
  }
}

// Function to add label and move the email to the labeled category
async function addLabelAndMoveEmail(gmail, threadId, labelName) {
  try {
    // Get the label ID for the given label name
    const labelsRes = await gmail.users.labels.list({ userId: 'me' });
    const labels = labelsRes.data.labels;
    const label = labels.find((l) => l.name === labelName);

    let labelId;
    if (label) {
      labelId = label.id;
    } else {
      // Create the label if it doesn't exist
      const createLabelRes = await gmail.users.labels.create({
        userId: 'me',
        requestBody: { name: labelName },
      });
      labelId = createLabelRes.data.id;
    }

    // Modify the email to add the label and move it to the labeled category
    await gmail.users.messages.modify({
      userId: 'me',
      id: threadId,
      requestBody: { addLabelIds: [labelId], removeLabelIds: ['INBOX'] },
    });

    console.log('Email labeled and moved successfully!');
  } catch (error) {
    console.error('Error adding label and moving email:', error);
  }
}

// Utility function to convert an email to RFC 2822 format
function createRawEmail(email) {
  const message = [
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    '',
    `${email.body}`,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
