<template>
  <div>
    <div class="container jumbotron">
      <h1 class="display-4">IRC-Tracker</h1>
      <p class="lead">Utilize the power of Twilio, Firebase, and the private IRC API to fetch grades via SMS.</p>
      <hr class="my-4">
      <p>Scroll down to create your IRC-Tracker Account.</p>
    </div>
    <div class="container">
      <h1>Instructions </h1>
      <p>1. Enter a phone number.</p>
      <!--W3 Schools-->
      <div class="form-group">
        <label for="usr">Phone Number:</label>
        <input type="text" class="form-control" id="usr">
      </div>
      <!--W3 Schools-->
      <button type ="button" class="btn btn-primary">Send Code</button>
      <p>2. Verify the phone number by entering the code messaged to you.</p>
      <!--W3 Schools-->
      <div class="form-group">
        <label for="usr">Auth Code:</label>
        <input type="text" class="form-control" id="usr">
      </div>
      <!--W3 Schools-->
      <button type ="button" class="btn btn-primary">Verif</button>
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
        <label for="usr">Auth ID:</label>
        <input type="text" class="form-control" id="usr">
      </div>
      <!--W3 Schools-->
      <button @click="onSubmit" type ="button" class="btn btn-primary">Save</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home Page',
  data() {
    return {
    }
  },
  methods: {
    onSubmit() {

    }
  }
}
</script>
