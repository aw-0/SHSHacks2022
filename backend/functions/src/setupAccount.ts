import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore"
import { getAuth, DecodedIdToken } from "firebase-admin/auth"
import * as twilio from "twilio"
import * as express from "express"
import * as cors from "cors"

// Daivd is a chad not facts
// hi there

initializeApp()
const db = getFirestore()
const auth = getAuth()
const config = functions.config()
console.log(config)
const smsClient = twilio(config.twilio.sid, config.twilio.auth, {
    logLevel: "debug"
})

const app = express()
app.use(cors({ origin: true }))

app.post('/', async (req, res) => {
    console.log('request sent')
    console.log(req.headers)
        console.log('request settttt')
        res.set('Access-Control-Allow-Origin', '*'); // https://stackoverflow.com/a/51922520
        functions.logger.log('Check if request is authorized with Firebase ID token');

        // https://github.com/firebase/functions-samples/blob/main/authorized-https-endpoint/functions/index.js
        if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
            functions.logger.error(
                'No Firebase ID token was passed as a Bearer token in the Authorization header.',
                'Make sure you authorize your request by providing the following HTTP header:',
                'Authorization: Bearer <Firebase ID Token>'
            );
            res.status(403).json({
                ok: false,
                error: 'Unauthorized'
            });
            return;
        }

        let idToken;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            functions.logger.log('Found "Authorization" header');
            // Read the ID Token from the Authorization header.
            idToken = req.headers.authorization.split('Bearer ')[1];
        } else {
            // Nothing
            res.status(403).json({
                ok: false,
                error: 'Unauthorized'
            });
            return;
        }

        let user: DecodedIdToken;

        try {
            const decodedIdToken = await auth.verifyIdToken(idToken);
            functions.logger.log('ID Token correctly decoded', decodedIdToken);
            req.body.user = decodedIdToken;
        } catch (error) {
            functions.logger.error('Error while verifying Firebase ID token:', error);
            res.status(403).json({
                ok: false,
                error: 'Unauthorized'
            });
            return;
        }
        const userId = req.body.user.uid
        console.log(req.body.user)
        if (req.body.user && req.body.phoneNumber && req.body.authCode) {
            const userDoc = await db.collection("Accounts").doc(userId).set({
                phoneNumber: req.body.phoneNumber,
                ircAuth: config.irc2.auth,
                userId: req.body.user.user_id
            })
            const messageResp = await smsClient.messages.create({
                body: "Welcome to IRC Tracker! Use the following replies to interface with your IRC grades:\n\n- all - Find all of your class grades\n- {CLASS_NAME}:grades - Get all current standard grades for a certain class. EXACT CLASS NAME MUST BE ENTERED.\n- {CLASS_NAME}:standards:{NUMBER} - Get assignment grades in a specifc standard in a specific class. EXACT CLASS NAME & STANDARD MUST BE ENTERED.",
                from: config.twilio.number,
                to: req.body.phoneNumber
            })
            res.json({
                ok: true,
                sent: true,
                messageId: messageResp.sid,
            })
        } else {
            res.status(400).json({
                ok: false,
                error: "UserId not sent"
            })
        } 
})

export default functions.https.onRequest(app);
