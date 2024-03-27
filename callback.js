const style1 = document.createElement("style");
const template1 = document.createElement("template");
style1.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");


.container {
  background-color: #fff;
  font-family: 'CiscoSansTT Light', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  height: 100vh;
  overflow: hidden;
  margin: 0;
}

.btn {
  background-color: #d40511;
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  padding: 8px 30px;
  margin: 5px;
  font-size: 14px;
}

.btn_video {
  background-color: green;
  color: #fff;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  padding: 8px 30px;
  margin: 5px;
  font-size: 14px;
}
.btn:active {
  transform: scale(0.98);
}

.btn:focus {
  outline: 0;
}

.btn:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
}

.customerbold {
   font-weight: bold;
}

}
#status {
  color: #d40511;
}
`;
template1.innerHTML = `
    <table class="container">
      <tr>
        <td>
          <div> 
            <br>
            <div>You can use this tab to send a text message to the person you are currently speaking to. You are on a call with:</div> 
            <br>Name:
            <span id="custname" class="customerbold">custname</span> Mobile No.: <span id="custnumber" class="customerbold">custnumber</span> Email: <span id="custemail" class="customerbold">custemail</span></div>
            <br>
            <br>
        </td>
      </tr>
      <tr>
        <td>
          <div style ="display: inline-block;">
            <textarea placeholder="Enter you message here or select a Template..." id="messagetosend" rows="5" cols="50"></textarea>
          </div>
          <div style ="display: inline-block;"></div>
          <div style ="display: inline-block;vertical-align:top">
          <h4 style="margin:0px">Templates</h4>
            <select class="form-control"  id="firstList" name="firstList">
            </select>
            
          </div>

            <div class="col-md-4">
            <form>
            </form>
            

            <br>
            <button class="btn" id="sendtextbtn">Send Message</button>
            <button class="btn" id="resetbtn">Reset</button>
            <button class="btn_video" id="videobtn">Video</button>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div style ="display: inline-block;">
            <h4 style="margin:0px">Callback</h4>
            <label for="meeting-time">Choose a time for your callback:</label>
            <input
               type="datetime-local"
               id="callback-time"
               name="callback-time" />
            <button class="btn_video" id="callbackbtn">Set Callback</button>
            <label class="mylabel" id="submitted"></label>
          </div>
        </td>
      </tr>
    </table>`;

class TextWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.timeoutID = undefined;
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template1.content.cloneNode(true));
    this.shadowRoot.appendChild(style1);

    const sendtextbtn = this.shadowRoot.getElementById("sendtextbtn");
    const resetbtn = this.shadowRoot.getElementById("resetbtn");
    const custname = this.shadowRoot.getElementById("custname");
    const custnumber = this.shadowRoot.getElementById("custnumber");
    const custemail = this.shadowRoot.getElementById("custemail");
    const messagetosend = this.shadowRoot.getElementById("messagetosend");
    const videobtn = this.shadowRoot.getElementById("videobtn");
    const callbackbtn = this.shadowRoot.getElementById("callbackbtn");
    const callback = this.shadowRoot.getElementById("callback-time");

    var list1 = this.shadowRoot.getElementById("firstList");
    var agentEmail = this.AgentEmail;
    var context = this.shadowRoot;

    list1.options[0] = new Option("        --Select--        ", "");
    list1.options[1] = new Option(
      "Appointment Manager - WhatsApp",
      "Your service appointment is confirmed for 10.30am on 22/08/2022. Click on this link to manage your appointment and get updates any time using our WhatsApp channel https://wa.link/8ox2ce."
    );
    list1.options[2] = new Option(
      "WhatsApp - Deflect to WhatsApp",
      "Thanks for using our WhatsApp channel. Click on the link to get the conversation started. https://wa.link/ael0r2."
    );
    list1.options[3] = new Option(
      "Facebook - Deflect to Facebook",
      'Thanks for using our Facebook Messenger channel. Click on the link to get connected. http://m.me/102055165863927. Type "help" for self service, or say "hi" to transfer to one of my human colleagues'
    );
    list1.options[4] = new Option(
      "Survey - Send the Survey Link",
      "Thanks for contacting Webex today. Click on the link to complete a quick survey and tell us how we did. http://nps.bz/WX-329903&mode=reuse"
    );
    list1.options[5] = new Option(
      "Youtube Video - Send a link to our Youtube channel",
      "Thanks for contacting Webex today. Click on the link to find out more on out Youtube channel.  https://www.youtube.com/watch?v=hkRi3GG1QuM"
    );
    list1.options[6] = new Option(
      "Email Terms and Conditions",
      "Click Send Message to send the terms and conditions to the customer email address above"
    );
    list1.options[7] = new Option(
      "Credit Limit Approved",
      "We have increased the limit on your credit card ending 4321 as discussed with our Credit Specialist earlier today. You will receive a letter in the next day of so to confirm the amount and terms of the increase."
    );
    list1.options[8] = new Option(
      "Password Reset",
      "Thanks for choosing our interactive Whatsapp Password Reset service. Please click on the link to get started https://wa.link/mjf6dl"
    );

    //update button background-color based on custom element attribute "btncolour"
    sendtextbtn.style.backgroundColor = this.btnColour;
    resetbtn.style.backgroundColor = this.btnColour;

    console.log("[TEXTWIDGET] - Text widget loading...");
    this.printProperties();

    //load properties with default values for when running outsise WxCC Desktop
    let aniNoPlus = "34606095514";
    let agentId = "";
    let agentName = "";
    let customerName = "Obi-Wan Kenobi";
    let triggerTextSendURL = "https://hooks.imiconnect.eu/events/YXRL45TZ2W"; // Carles webhook"https://hooks.imiconnect.io/events/XYIIW1WYGR";
    let triggerEmailSendURL =
      "https://hooks.uk.webexconnect.io/events/GQYWIPHJO2"; // Carles webhook"https://hooks.imiconnect.io/events/XYIIW1WYGR";
    let setupVideoURL = "https://hooks.uk.webexconnect.io/events/BLA846SZCJ";
    let setupCallbackURL = "https://hooks.us.webexconnect.io/events/IYATMRHJPU";
    let FlyHighBaseURL = "https://flyhighbookings.duckdns.org";

    //get all the parameters for sending payment, you must pass "customerPrefix": "string" and "currentTask": "$STORE.agentContact.taskSelected" as widget properties
    // Try to load properties from Desktop Layout
    if (this.triggerTextSendURL) {
      triggerTextSendURL = this.triggerTextSendURL;
    } else {
      console.log(
        "[TEXTWIDGET] - WARNING - Unable to load desktop layout properties, check your Desktop Layout OR you are running outside WxCC desktop"
      );
    }

    try {
      if (this.currentTask) {
        agentId = this.currentTask.agentId;
        agentName = this.currentTask.ownerName;
        if (this.currentTask.mediaChannel == "broadcloud") {
          // Voice call
          if (this.currentTask.contactDirection == "INBOUND") {
            aniNoPlus = this.currentTask.callAssociatedData.ani.value.replace(
              /\+/g,
              ""
            );
            customerName =
              this.currentTask.callAssociatedData.CustomerName.value; //CustomerName expected as Call Variable}
            setvoicedisplay(customerName);
            //customerName = getcustomername(aniNoPlus);
          } else {
            //OUTBOUND
            // Check for leading zero
            if (
              this.currentTask.callAssociatedData.dn.value.substring(0, 1) ==
              "0"
            ) {
              aniNoPlus = this.currentTask.callAssociatedData.dn.value.replace(
                "0",
                "44"
              );
            } else {
              aniNoPlus = this.currentTask.callAssociatedData.dn.value.replace(
                /\+/g,
                ""
              );
            }
            // Outbound call so we don't know the name, need to look it up
            customerName = getcustomername(aniNoPlus);
          }
        } else if (this.currentTask.mediaChannel == "sms") {
          //SMS
          aniNoPlus = this.currentTask.ani;
          customerName = getcustomername(this.currentTask.ani);
        } else if (this.currentTask.mediaChannel == "facebook") {
          // Facebook
          // All we have is the PSID - we need to lookup both the number and the name
          getcustomernamefromPSID(this.currentTask.ani);
        } else if (
          this.currentTask.mediaChannel == "web" ||
          this.currentTask.mediaChannel == "email"
        ) {
          // Chat or Email behave the same
          // All we have is the email address - we need to lookup both the number and the name
          getcustomernamefromEmail(this.currentTask.ani);
        } else if (this.currentTask.mediaChannel == "whatsapp") {
          // Chat or Email behave the same
          // All we have is the email address - we need to lookup both the number and the name
          aniNoPlus = this.currentTask.ani;
          getcustomername(this.currentTask.ani);
        }
      } else {
        console.log(
          "[TEXTWIDGET] - WARNING - Unable to load Flow Variables, check your Flow OR you are running outside WxCC desktop"
        );
      }
    } catch (error) {
      console.log(error);
    }

    function setvoicedisplay(name) {
      //Set Customer Name in widget
      custname.innerHTML = name;
      custnumber.innerHTML = "0" + aniNoPlus.slice(2);

      console.log("[TEXTWIDGET] - Text widget loaded");
    }

    function setdigitaldisplay(result) {
      //Set Customer Name in widget
      custname.innerHTML = result.name;
      custemail.innerHTML = result.email;
      custnumber.innerHTML = "0" + aniNoPlus.slice(2);

      console.log("[TEXTWIDGET] - Text widget loaded");
    }

    function setdigitaldisplayBoth(result) {
      //Set Customer Name in widget
      custname.innerHTML = result.name;
      custemail.innerHTML = result.email;
      aniNoPlus = result.mobile;
      custnumber.innerHTML = "0" + aniNoPlus.slice(2);

      console.log("[TEXTWIDGET] - Text widget loaded");
    }

    //Send SMS when sendtext button is pressed
    sendtextbtn.addEventListener("click", () => {
      sendtextbtn.disabled = true;
      sendtextbtn.style.backgroundColor = "#e0e0e0";
      sendtext();
    });

    //Set up video button pressed
    videobtn.addEventListener("click", () => {
      videobtn.disabled = true;
      videobtn.style.backgroundColor = "#e0e0e0";
      setupvideo();
    });

    //Set up callback button pressed
    callbackbtn.addEventListener("click", () => {
      callbackbtn.disabled = true;
      callbackbtn.style.backgroundColor = "#e0e0e0";
      setupcallback();
    });

    //Send SMS when sendtext button is pressed
    list1.addEventListener("click", () => {
      messagetosend.value = list1.value;
    });

    // Reset things
    resetbtn.addEventListener("click", () => {
      sendtextbtn.disabled = false;
      sendtextbtn.style.backgroundColor = this.btnColour;
      videobtn.disabled = false;
      videobtn.style.backgroundColor = "green";
      callbackbtn.disabled = false;
      callbackbtn.style.backgroundColor = "green";
      messagetosend.value = "";
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.timeoutID = undefined;
    });

    function setupvideo() {
      const myHeaders = new Headers();

      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        customerName: custname.innerHTML,
        phoneNumber: aniNoPlus,
        email: agentId,
        channel: "Voice",
        AgentName: agentName,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(
        `[TEXTWIDGET] - Sending request to ${setupVideoURL} with request options:`
      );
      console.log(requestOptions);
      fetch(setupVideoURL, requestOptions)
        .then((response) => response.text())
        .then((result) => console.log("[TEXTWIDGET]\n" + result))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function setupcallback() {
      const myHeaders = new Headers();
      var year = callback.value.slice(0, 4);
      var month = callback.value.slice(5, 7);
      var day = callback.value.slice(8, 10);
      var time = callback.value.slice(11, 16) + ":00";

      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        Name: custname.innerHTML,
        CustomerNumber: "+" + aniNoPlus,
        Email: agentEmail,
        Callback: day + "-" + month + "-" + year + " " + time,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(
        `[TEXTWIDGET] - Sending request to ${setupCallbackURL} with request options:`
      );
      console.log(requestOptions);
      fetch(setupCallbackURL, requestOptions)
        .then((response) => response.text())
        .then((result) => callbackresults(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }
    function callbackresults(result) {
      var submittedboxid = context.getElementById("submitted");

      // Check for errors
      if (result.error) {
        submittedboxid.innerHTML =
          "Error: " + result.error.message[0].description;
      } else {
        submittedboxid.innerHTML =
          "Callback for " + callback.value + " successfully scheduled";
      }
    }

    function sendtext() {
      const myHeaders = new Headers();

      myHeaders.append("Content-Type", "application/json");

      // Don't send a text if sending an email

      if (list1.selectedIndex == "6") {
        messagetosend.value =
          "The terms and conditions have been emailed to " +
          custemail.innerHTML;

        const raw = JSON.stringify({
          EmailAddress: custemail.innerHTML,
          CustomerName: custname.innerHTML,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };
        console.log(
          `[TEXTWIDGET] - Sending request to ${triggerEmailSendURL} with request options:`
        );
        console.log(requestOptions);
        fetch(triggerEmailSendURL, requestOptions)
          .then((response) => response.text())
          .then((result) => console.log("[TEXTWIDGET]\n" + result))
          .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
      } else {
        const raw = JSON.stringify({
          Number: aniNoPlus,
          Text: messagetosend.value,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };
        console.log(
          `[TEXTWIDGET] - Sending request to ${triggerTextSendURL} with request options:`
        );
        console.log(requestOptions);
        fetch(triggerTextSendURL, requestOptions)
          .then((response) => response.text())
          .then((result) => console.log("[TEXTWIDGET]\n" + result))
          .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
      }
    }
    function getcustomername(number) {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      console.log(
        "[TEXTWIDGET] - Sending request to " +
          FlyHighBaseURL +
          "/cfa/getuserdata?ani=" +
          number +
          " with request options:"
      );
      console.log(requestOptions);

      fetch(FlyHighBaseURL + "/cfa/getuserdata?ani=" + number, requestOptions)
        .then((response) => response.text())
        .then((result) => setdigitaldisplay(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function getcustomernamefromPSID(PSID) {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      console.log(
        "[TEXTWIDGET] - Sending request to " +
          FlyHighBaseURL +
          "/cfa/getuserdata?psid=" +
          PSID +
          " with request options:"
      );
      console.log(requestOptions);

      fetch(FlyHighBaseURL + "/cfa/getuserdata?psid=" + PSID, requestOptions)
        .then((response) => response.text())
        .then((result) => setdigitaldisplayBoth(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function getcustomernamefromEmail(Email) {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      console.log(
        "[TEXTWIDGET] - Sending request to " +
          FlyHighBaseURL +
          "/cfa/getuserdata?email=" +
          Email +
          " with request options:"
      );
      console.log(requestOptions);

      fetch(FlyHighBaseURL + "/cfa/getuserdata?email=" + Email, requestOptions)
        .then((response) => response.text())
        .then((result) => setdigitaldisplayBoth(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }
  }
  get btnColour() {
    return this.getAttribute("btncolour");
  }

  set btnColour(newValue) {
    this.setAttribute("btncolour", newValue);
  }

  printProperties() {
    console.dir(this);
  }
}
customElements.define("text-widget", TextWidget);

// {
//   "comp": "text-widget",
// "script": "https://traveling-wirehaired-capybara.glitch.me/callback.js",
//   "attributes":{
// "btncolour" : "#0045A0"
// },
//   "properties":  {
// "currentTask": "$STORE.agentContact.taskSelected",
// "triggerTextSendURL" : "https://hooks.imiconnect.eu/events/YXRL45TZ2W",
//   "AgentEmail":"$STORE.agent.agentEmailId"
//   }
