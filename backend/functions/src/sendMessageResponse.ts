import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore"
import * as twilio from "twilio"
import axios from "axios"
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support"

const db = getFirestore()

const convertNumberToGrade = (gradeNumber: string) => {
    if (gradeNumber === "4") return "Exceeds"
    if (gradeNumber === "3") return "Meets"
    if (gradeNumber === "2") return "Approaching"
    if (gradeNumber === "1") return "Developing"
}

interface CourseResp {
    courseName: string,
    assessment: {
        isFinal: boolean
        projectedGrade: string
        sectionID: number
        standards: [
            {
                assignments: [
                    {
                        activityName: string
                        comments: [string] | null
                        dueDate: string
                        isHomework: boolean
                        isMissing: boolean
                        isNotAssigned: false
                        score: string
                        scoreGroupName: string
                        standardEventActive: number
                    }
                ]
                gradingTask: string
                isHomeworkStandard: boolean
                proficiency: {
                    approachingCount: number
                    developingCount: number
                    exceedsCount: number
                    meetsCount: number
                    proficiencyScore: number
                }
                proficiencyLevel: string
                standardName: string
            }
        ],
        studentPersonID: number
        weeklyGrowth: string
    },
    student: null
    weeklyGrowth: [
        {
            comments: string
            score: string
            sectionID: number
            sequence: number
            studentPersonID: number
            task: string
        }
    ]
}

export default functions.https.onRequest(async (req, resp) => {
    if (req.method === "POST") {
        resp.setHeader("Content-Type", "text/xml")
        const fromNumber = req.body.From
        const body = req.body.Body.toLowerCase()
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
                if (body === "all" || body.includes(":grades") || body.includes(":standards")) {
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
                            let courseResponses: [CourseResp?] = []
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
                                        courseResponses[course.sectionId] = courseGradesResp.data as CourseResp
                                        courseResponses[course.sectionId]!.courseName = course.courseName
                                    }
                                }
                            }
                            const messageSendBack = new twilio.twiml.MessagingResponse()
                            if (body === "all") {
                                let formattedClass = ""
                                for (const courseData of courseResponses) {
                                    if (courseData) {
                                        formattedClass += `${courseData.courseName}: ${courseData.assessment.projectedGrade}\n`
                                    }
                                }
                                messageSendBack.message(`Welcome to IRC Tracker! Here are all of your classes: \n\n${formattedClass}`)
                            } else if (body.includes(":grades")) {
                                const className = body.substring(0, body.indexOf(":")).toLowerCase()
                                let formattedGrades = ""
                                for (const courseData of courseResponses) {
                                    if (courseData && courseData.courseName.toLowerCase() === className) {
                                        for (const standard of courseData.assessment.standards) {
                                            console.log("in")
                                            console.log(standard.proficiencyLevel)
                                            formattedGrades += `${standard.standardName} - ${standard.proficiencyLevel?.slice(0, standard.proficiencyLevel?.indexOf("-"))}\n`
                                        }
                                        messageSendBack.message(`Welcome to IRC Tracker! Here are all of your grades for ${courseData.courseName}: \n\n${formattedGrades}`)
                                    }
                                }
                            } else if (body.includes(":standards:")) {
                                const className = body.substring(0, body.indexOf(":")).toLowerCase()
                                let standardName = body.slice(body.indexOf("s:"))
                                standardName = standardName.replace("s:", "")
                                let formattedStandardGrades = ""
                                for (const courseData of courseResponses) {
                                    if (courseData && courseData.courseName.toLowerCase() === className) {
                                        for (const standard of courseData.assessment.standards) {
                                            console.log(`${standard.standardName} vs ${standardName}`)
                                            if (standard.standardName.toLowerCase().includes(standardName[0])) {
                                                standardName = standard.standardName
                                                for (const assignment of standard.assignments) {
                                                    formattedStandardGrades += `${assignment.activityName}: ${convertNumberToGrade(assignment.score)}\n`
                                                }
                                            }
                                        }
                                        messageSendBack.message(`Welcome to IRC Tracker! Here are all of your grades for ${courseData.courseName} in the category of ${standardName}: \n\n${formattedStandardGrades}`)
                                    }
                                }
                            }
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
                    messageSendBack.message("Welcome to IRC Tracker! Use the following replies to interface with your IRC grades:\n\n- all - Find all of your class grades\n- {CLASS_NAME}:grades - Get all current standard grades for a certain class. EXACT CLASS NAME MUST BE ENTERED.\n- {CLASS_NAME}:standards:{NUMBER} - Get assignment grades in a specifc standard in a specific class. EXACT CLASS NAME & STANDARD MUST BE ENTERED.")
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
