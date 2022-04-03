## IRC-Tracker
### Build for SHS Hacks 2022

This project is for AESHS students who want to check their grades but don't want to constantly have to go to D125's Interactive Report Card (IRC) website.
Using text messages via Twilio, users of IRC-Tracker can check all of their current grades, their grades in each standard for different classes, and the grades for all of their assignments in a single standard. Anytime a student wants to check their grades, all they have to do is just text a phone number.

The instructions on how to use the project are on https://irc-tracker.web.app, a website they will use to sign up. 
The different commands a user can send to the Twilio number are messaged after they sign up.

### Further Improvements: 
- Notification message alerts when new assignments are added & graded on the Grading System, a **highly requested feature from many students**.
- A set time at when the user's grades are texted to them, such as once a week, once a day, or at the end of a semester.
- Semester GPA Prediction by calculating all projected grades into a unweighted GPA number.

### Sources Used
#### Backend
- Twilio (SMS API)
- axios
- Saleforce's `tough-cookie` & 3846masa's `axios-cookiejar-support`
#### Website
- Vue & Nuxt.js
- Bootstrap
- reCAPTCHA
#### Other
- Firebase (Firestore, Functions, Hosting)
- W-3 Schools
- StackOverflow
