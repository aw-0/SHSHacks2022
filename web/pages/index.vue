<template>
  <div>
    <div class="container jumbotron">
      <h1 class="display-4">IRC-Tracker</h1>
      <p class="lead">Utilize the power of Twilio, Firebase, and the PRIVATE and UNDOCUMENTED Stevenson Interactive Report Card API to fetch your grades via SMS.</p>
      <hr class="my-4">
      <p>Scroll down to create your IRC-Tracker Account.</p>
    </div>
    <div class="container">
      <h1>Instructions </h1>
      <div id="part1" v-if="flow === 1">
        <p>1. Enter a phone number to create your account.</p>
        <!--W3 Schools-->
        <div class="form-group">
          <label for="phone">Phone Number:</label>
          <input type="tel" class="form-control" id="phone" v-model="phoneNumber" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}">
        </div>
        <!--W3 Schools-->
        <button id="sign-in-button" type="button" class="btn btn-primary">Send Code</button>
        <p v-if="error" style="color: red;">{{error}}</p>
      </div>
      <div id="part2" v-if="flow === 2">
        <p>2. Verify the phone number by entering the code messaged to you.</p>
        <!--W3 Schools-->
        <div class="form-group">
          <label for="code">Auth Code:</label>
          <input v-model="mfaCode" type="text" class="form-control" id="code">
        </div>
        <!--W3 Schools-->
        <button @click="verifyPhoneNumber()" type="button" class="btn btn-primary">Verify</button>
        <p v-if="error" style="color: red;">{{error}}</p>
      </div>
      <div id="part3" v-if="flow === 3">
        <p>3. Get your IRC Authorization Identification (Auth ID) by following the steps below.</p>
        <p>   a. Open your IRC Report Card and press F12 (If you dont have function keys, Instead, right click the page and select inspect).</p>
        <img src="/img/Step-1.png" alt="Image " width="900" height="400" />
        <img src="/img/Step-1.5.png" alt="Image " width="900" height="400" />

        <p>   b. Click on the two arrows and select “Application”.</p>
        <img src="/img/Step-2.png" alt="Image " width="900" height="400" />
        
        <p>   c. Drop down the cookies menu and select the https://irc.d125.org cookies</p>
        <img src="/img/Step-3.png" alt="Image " width="900" height="400" />

        <p>   d. Finally, click on IRC2.Auth and copy your IRC2.Auth value</p>
        <img src="/img/Step-4.png" alt="Image " width="900" height="400" >
        
        <p>4. Paste your Auth ID here</p>
        <!--W3 Schools-->
        <div class="form-group">
          <label for="authId">Auth ID:</label>
          <input type="text" v-model="authCode" class="form-control" id="authId" disabled>
        </div>
        <!--W3 Schools-->
        <button @click="onSubmit()" type ="button" class="btn btn-primary">Save</button>
        <p v-if="error" style="color: red;">{{error}}</p>
      </div>
      <div id="part4" v-if="flow === 4">
        <p>Check {{phoneNumber}} soon for a message from (903) 289-7411 regarding IRC-Tracker!</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home Page',
  data() {
    return {
      phoneNumber: '+1',
      mfaCode: '',
      authCode: 'Using test Auth ID since judges do not have access to IRC! Just click "Submit"!',
      fbUser: null,
      flow: 1,
      error: '',
      signedUp: false,
    }
  },
  mounted() {
    this.$fire.auth.useDeviceLanguage();
    this.recaptchaVerifier = new this.$fireModule.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log('reCAPTCHA solved, allow signInWithPhoneNumber.');
        this.submitPhoneNumber();
      }
    });
    this.recaptchaVerifier.render().then((widgetId) => {
      this.recaptchaWidgetId = widgetId;
    });
  },
  methods: {
    submitPhoneNumber() {
      if (!this.phoneNumber) {
        this.error = 'Please enter a phone number';
        return;
      } else {
        if (!this.signedUp) {
          this.$fire.auth.signInWithPhoneNumber(this.phoneNumber, this.recaptchaVerifier)
          .then(confirmationResult => {
            this.error = ""
            this.signedUp = true
            this.confirmationResult = confirmationResult;
            this.flow = 2;
          })
          .catch(error => {
            this.error = error
          });
        }
      }
    },
    verifyPhoneNumber() {
      if (!this.mfaCode) {
        this.error = 'Please enter a phone number';
        return;
      } else {
        this.confirmationResult.confirm(this.mfaCode)
          .then(result => {
            this.error = ""
            this.fbUser = result.user
            this.flow = 3;
          })
          .catch(error => {
            this.error = error
          });
      }
    },
    async onSubmit() {
      if (!this.authCode) {
        this.error = 'Please enter a your IRC2.Auth code';
        return;
      } else {
        const token = await this.$fire.auth.currentUser.getIdToken()
        await this.$axios.post('https://us-central1-irc-tracker.cloudfunctions.net/setupAccount-default', {
          authCode: this.authCode,
          phoneNumber: this.phoneNumber,
          userId: this.$fire.auth.currentUser.id
        }, {
          headers: {
            authorization: `Bearer ${token}`
          }
        }).then(response => {
          console.log("finished")
          this.error = ""
          this.flow == 4;
        }).catch(error => {
          this.error = error
        })
      }
    },
  }
}
</script>
