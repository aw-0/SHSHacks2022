import * as functions from "firebase-functions";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import * as twilio from "twilio"

// const serviceAccount = require( "../../irc-updates.json")
initializeApp({
    // credential: cert(serviceAccount)
})
// Daivd is a chad not facts
// hi there
const db = getFirestore()
const smsClient = twilio("ACf9d710510a3e71df488fcdb209e02bbe", "18dd58581de0fdec961621ddbb487d75", {
    logLevel: "debug"
})

export default functions.https.onRequest(async (res, resp) => {
    if (res.method === "POST") {
        const userIdToSendGrades = res.body.userId
        if (userIdToSendGrades) {
            const userDoc = await db.collection("Accounts").doc(userIdToSendGrades).get()
            if (userDoc.exists) {
                const data = userDoc.data()
                const messageResp = await smsClient.messages.create({
                    body: "\n\nhi there from irc-tracker",
                    from: "+19032897411",
                    to: data!.phoneNumber
                })
                resp.json({
                    sent: true,
                    messageId: messageResp.sid,
                    userId: data
                })
            } else {
                resp.status(400).json({
                    ok: false,
                    error: "Could not find userDoc"
                })
            }
        } else {
            resp.status(400).json({
                ok: false,
                error: "UserId not sent"
            })
        }
    } else {
        resp.status(404)
    }
});
