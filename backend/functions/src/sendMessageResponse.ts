import * as functions from "firebase-functions";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore"
import * as twilio from "twilio"
import axios from "axios"
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support"

// const serviceAccount = require( "../../irc-updates.json")
// initializeApp({
//     // credential: cert(serviceAccount)
// })
const db = getFirestore()
const smsClient = twilio("ACf9d710510a3e71df488fcdb209e02bbe", "18dd58581de0fdec961621ddbb487d75", {
    logLevel: "debug"
})

export default functions.https.onRequest(async (req, resp) => {
    if (req.method === "POST") {
        resp.setHeader("Content-Type", "text/xml")
        const fromNumber = req.body.From
        const body = req.body.Body
        if (fromNumber) {
            const userDoc = await db.collection("Accounts").where("phoneNumber", "==", fromNumber).get()
            if (userDoc.docs[0].exists) {
                const data = userDoc.docs[0].data()
                const jar = new CookieJar()
                jar.setCookie(`IRC2.Auth=${data.ircAuth}; path=/; secure; samesite=lax; httponly; Domain=irc.d125.org`, "https://irc.d125.org", {
                    http: true,
                    secure: true,
                })
                const axiosClient = wrapper(axios.create({ jar }))
                if (body === "all") {
                    const ircAuthResp = await axiosClient.get("https://irc.d125.org/users/authenticate")
                    if (ircAuthResp.status === 200 && ircAuthResp.data) {
                        const ircPersonId = ircAuthResp.data.personId
                        const ircStudentResp = await axiosClient.get(`https://irc.d125.org/course/student?pid=${ircPersonId}&cid=66&tid=110`, {
                            headers: {
                                referer: "https://irc.d125.org/reportcard",
                            }
                        })
                        if (ircStudentResp.status === 200 && ircStudentResp.data) {
                            let sectionIds: [number?] = []
                            let formattedClass = ""
                            console.log(ircStudentResp.data)
                            for (const course of ircStudentResp.data) {
                                if (!sectionIds.includes(course.sectionId)) {
                                    sectionIds.push(course.sectionId)
                                    const courseGradesResp = await axiosClient.get(`https://irc.d125.org/student/gradebookbystudent?sid=${course.sectionId}&pid=${ircPersonId}&isEBR=true`, {
                                        headers: {
                                            referer: "https://irc.d125.org/reportcard"
                                        }
                                    })
                                    console.log(course.courseName)
                                    if (courseGradesResp.status === 200 && courseGradesResp.data.assessment && courseGradesResp.data.assessment.projectedGrade) {
                                        console.log("in")
                                        formattedClass += `${course.courseName}: ${courseGradesResp.data.assessment.projectedGrade}\n`
                                    }
                                }
                            }
                            const messageSendBack = new twilio.twiml.MessagingResponse()
                            messageSendBack.message(`Welcome to IRC Tracker! Here are all of your classes: \n\n${formattedClass}`)
                            resp.status(200).send(messageSendBack.toString())
                        } else {
                            const messageSendBack = new twilio.twiml.MessagingResponse()
                            messageSendBack.message("Welcome to IRC Tracker! We had an issue getting your grades. Please try again later.")
                            resp.status(200).send(messageSendBack.toString())
                        }
                    } else {
                        const messageSendBack = new twilio.twiml.MessagingResponse()
                        messageSendBack.message("Welcome to IRC Tracker! We had an issue getting your grades. Please try again later.")
                        resp.status(200).send(messageSendBack.toString())
                    }
                } else {
                    const messageSendBack = new twilio.twiml.MessagingResponse()
                    messageSendBack.message("Welcome to IRC Tracker! Use the following replies to interface with your IRC grades:\n\n- all - Find all of your class grades")
                    resp.status(200).send(messageSendBack.toString())
                }
            } else {
                const messageSendBack = new twilio.twiml.MessagingResponse()
                messageSendBack.message("Welcome to IRC Tracker! We could not find your user account. Visit https://irc-tracker.web.app to sign up.")
                resp.status(200).send(messageSendBack.toString())
            }
        } else {
            const messageSendBack = new twilio.twiml.MessagingResponse()
            messageSendBack.message("Welcome to IRC Tracker! Twilio Error.")
            resp.status(200).send(messageSendBack.toString())
        }
    } else {
        resp.status(404)
    }
});
