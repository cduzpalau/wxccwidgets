const style = document.createElement("style");
const template = document.createElement("template");
style.textContent = `
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

.bigtick {
  font-size:40px;
  font-weight: bold;
  align-items: center;
}

#status {
  color: #d40511;
}

.paystatus {
  align-items: center;
  text-align: center;
  white-space: nowrap;
}

.loader {
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #ff9933; /* Orange */
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;

}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
template.innerHTML = `
    <table class="container">
      <tr>
        <td>
          <div class="container"> 
            <br>
            <div>  
              <img style="height:25px" src="https://cdn.glitch.global/19305b64-625b-4779-8a75-96baca7040a9/Mastercard_logo.jpg?v=1648720428339">
              <img style="height:25px" src="https://cdn.glitch.global/19305b64-625b-4779-8a75-96baca7040a9/Visa-Logo.png?v=1648720500186">
            </div>
            <div class="paystatus">Payment Status for order number: <span id="orderid">#dhl12345</span>: 
            <br>
            <div style ="display: inline-block;padding-right:10px">
            <span id="spinner" class="loader" style ="display: inline-block; visibility:hidden"></span>
            </div>
            <div style ="display: inline-block;"><span id="status" class="bigtick">Payment Due</span></div></div>
            <!--div class="paystatus">Payment Status for Account: <span id="status"><b>Payment Due</b></span></div-->
            
            <div>There is a payment due on this account of <b>£199.00</b></div>
            <br>
            <b>Instructions to collect card payment:</b>
            <div>STAY ON THE LINE AND TALK THE CUSTOMER THROUGH THE FOLLOWING STEPS</div>
            <div>Click the <i>Send Payment Link</i> button to send a text message to the customer.</div>
            <div>The text message will contain a secure link to our online payment portal.</div>
            <div>Tell the customer to click the link and enter their payment details as prompted on the screen.</div>
            <div>You can see the screen that the customer will be looking at over here on the right ------>>>>>></div>
            <div>You will be notified above when the payment is successful.</div>
            <br>   
            <button class="btn" id="sendlink">Send Payment link</button>
            <button class="btn" id="reset">Reset</button>
          </div>
        </td>
        <td>
          <div class="container">
            <div style="margin-top:50px">
               <img style="border:1px solid black;height:400px;width=40px" src="https://cdn.glitch.global/9d459a07-dfab-44f2-859f-c28afb5b361c/Generic%20Payment.jpg?v=1651057417343">          
            </div>
          </div>
        </td>
      </tr>
    </table>`;

class PayWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.timeoutID = undefined;
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.appendChild(style);

    //poll interval for check payment function
    let POLL_INTERVAL = 5000;
    //Max attempts for check payment polling function
    let MAX_ATTEMPTS = 10;

    const orderid = this.shadowRoot.getElementById("orderid");
    const progress = this.shadowRoot.getElementById("status");
    const spinner = this.shadowRoot.getElementById("spinner");
    const linkbtn = this.shadowRoot.getElementById("sendlink");
    const resetbtn = this.shadowRoot.getElementById("reset");

    //update button background-color based on custom element attribute "btncolour"
    linkbtn.style.backgroundColor = this.btnColour;
    resetbtn.style.backgroundColor = this.btnColour;

    console.log("[PAYWIDGET] - Pay widget loading...");
    this.printProperties();

    //load properties with default values for when running outsise WxCC Desktop
    let customerPrefix = "LOCAL";
    let aniNoPlus = "34606095514";
    let orderNumber = "12345";
    let charge = "â‚¬56.99";
    let customerName = "Obi-Wan Kenobi";
    let triggerPaymentFetchURL =
      "https://hooks.imiconnect.eu/events/TRROTLH8B3"; // Carles webhook"https://hooks.imiconnect.io/events/XYIIW1WYGR";
    let checkPaymentFetchURL =
      "https://hooks.imiconnect.eu/syncwebhook/7XUOL0N0BK"; //Carles Webhook    "https://hooks.imiconnect.io/syncwebhook/RJH7LRZ4U9";
    let checkPaymentAuthKey = "c3683c03-9a40-11ec-9d17-0aaac5b19840"; // Carles "656a7e4d-899b-11ec-8286-0645430715b9"
    let FlyHighBaseURL = "https://flyhighbookings.duckdns.org";

    //get all the parameters for sending payment, you must pass "customerPrefix": "string" and "currentTask": "$STORE.agentContact.taskSelected" as widget properties
    // Try to load properties from Desktop Layout
    if (this.customerPrefix) {
      customerPrefix = this.customerPrefix;
      triggerPaymentFetchURL = this.triggerPaymentWebhookURL;
      checkPaymentFetchURL = this.checkPaymentSyncWebhookURL;
      checkPaymentAuthKey = this.syncWebhookKey;
      POLL_INTERVAL = this.pollInterval;
      MAX_ATTEMPTS = this.maxAttempts;
    } else {
      console.log(
        "[PAYWIDGET] - WARNING - Unable to load desktop layout properties, check your Desktop Layout OR you are running outside WxCC desktop"
      );
    }
    try {
      if (this.currentTask) {
        if (this.currentTask.mediaChannel == "broadcloud") {
          // Voice call
          // Inbound or outbound call
          if (this.currentTask.contactDirection == "INBOUND") {
            //INBOUND
            aniNoPlus = this.currentTask.callAssociatedData.ani.value.replace(
              /\+/g,
              ""
            );
          } else {
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
          }
          if (this.currentTask.callAssociatedData.Charge) {
            //OUTBOUND
            orderNumber = this.currentTask.callAssociatedData.OrderId.value; //OrderId expected as Call Variable}
            charge = this.currentTask.callAssociatedData.Charge.value; //Charge expected as Call Variable
            customerName =
              this.currentTask.callAssociatedData.Customer_Name.value; //CustomerName expected as Call Variable}
            setInboundDisplay();
          } else {
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
          "[PAYWIDGET] - WARNING - Unable to load Flow Variables, check your Flow OR you are running outside WxCC desktop"
        );
      }
    } catch (error) {
      console.log(error);
    }

    function setInboundDisplay() {
      //Set Order ID in widget
      orderid.innerHTML = customerPrefix + orderNumber;

      console.log("[PAYWIDGET] - Pay widget loaded");
    }

    function setOutboundDisplay(result) {
      //Set Customer Name in widget
      customerName = result.name;
      orderNumber = "12345";
      orderid.innerHTML = customerPrefix + orderNumber;
      charge = "199.00";

      console.log("[PAYMENTWIDGET] - Pay widget loaded");
    }

    function setdigitaldisplayBoth(result) {
      //Set Customer Name in widget
      customerName = result.name;
      orderNumber = "12345";
      aniNoPlus = result.mobile;
      orderid.innerHTML = customerPrefix + orderNumber;
      charge = "199.00";
      console.log("[PAYWIDGET] - Text widget loaded");
    }

    //Send payment SMS with link when sendlink button is pressed
    linkbtn.addEventListener("click", () => {
      progress.innerHTML = "Awaiting Payment";
      progress.style.fontsize = "40px";
      spinner.style.visibility = "visible";
      progress.style.color = "#ff9933";
      linkbtn.disabled = true;
      linkbtn.style.backgroundColor = "#e0e0e0";
      sendlink();
    });

    //send confirmation SMS when sendconf button is pressed, button will be enabled when payment is completed
    resetbtn.addEventListener("click", () => {
      linkbtn.disabled = false;
      linkbtn.style.backgroundColor = this.btnColour;
      progress.innerHTML = "Payment Due";
      progress.style.color = "red";
      progress.style.fontsize = "40px";
      spinner.style.visibility = "hidden";
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.timeoutID = undefined;
    });

    function sendlink() {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        waid: aniNoPlus,
        orderId: orderNumber,
        customsCharge: charge,
        name: customerName,
        customerPrefix: customerPrefix,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(
        `[PAYWIDGET] - Sending request to ${triggerPaymentFetchURL} with request options:`
      );
      console.log(requestOptions);
      fetch(triggerPaymentFetchURL, requestOptions)
        .then((response) => response.text())
        .then((result) => console.log("[PAYWIDGET]\n" + result))
        .catch((error) => console.log("[PAYWIDGET] - ERROR - ", error));

      const pollForPaymentComplete = poll({
        fn: checkPaymentComplete,
        validate: validatePayment,
        interval: POLL_INTERVAL,
        maxAttempts: MAX_ATTEMPTS,
      })
        .then(function () {
          progress.innerHTML = "✓ Payment Successful";
          progress.style.color = "green";
          progress.style.fontsize = "36px";
          spinner.style.visibility = "hidden";
        })
        .catch((err) => {
          progress.innerHTML = "Timeout - Max Attempts reached";
          console.error(err);
        });
    }

    function getcustomername(number) {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      console.log(
        "[PAYWIDGET] - Sending request to " +
          FlyHighBaseURL +
          "/cfa/getuserdata?ani=" +
          number +
          " with request options:"
      );
      console.log(requestOptions);

      fetch(FlyHighBaseURL + "/cfa/getuserdata?ani=" + number, requestOptions)
        .then((response) => response.text())
        .then((result) => setOutboundDisplay(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function getcustomernamefromPSID(PSID) {
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      console.log(
        "[PAYWIDGET] - Sending request to " +
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
        "[PAYWIDGET] - Sending request to " +
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

    const poll = ({ fn, validate, interval, maxAttempts }) => {
      console.log("Start poll...");
      let attempts = 0;

      const executePoll = async (resolve, reject) => {
        console.log("- poll");
        const result = await fn();
        attempts++;

        if (validate(result)) {
          return resolve(result);
        } else if (maxAttempts && attempts === maxAttempts) {
          return reject(new Error("Exceeded max attempts"));
        } else {
          this.timeoutID = setTimeout(executePoll, interval, resolve, reject);
        }
      };

      return new Promise(executePoll);
    };
    const checkPaymentComplete = async () => {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("key", checkPaymentAuthKey);

      const raw = JSON.stringify({
        waId: aniNoPlus,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(
        `[PAYWIDGET] - Sending request to ${checkPaymentFetchURL} with request options:`
      );
      console.log(requestOptions);

      // Expected response:
      // {
      //   "payStatus": "$(payStatus)", paid, unpaid
      //   "statusCode": "$(statusCode)", 200 (profile matched), 400 (no profile matched)
      //   "transid": "$(transid)"
      // }
      const response = await fetch(checkPaymentFetchURL, requestOptions);
      const jsonresponse = await response.json();
      console.log(jsonresponse);

      return jsonresponse;
      // const fakeresponse = {
      //   statuscode: "200",
      //   payStatus: "unpaid",
      // };
      // return fakeresponse;
    };

    const validatePayment = (jsonResponse) => {
      if (
        jsonResponse.statusCode === "200" &&
        jsonResponse.payStatus === "paid"
      ) {
        return true;
      }
      return false;
    };
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Custom element attributes changed. name: ${name}, oldValue: ${oldValue}, newValue: ${newValue}`
    );
    // console.log(this.currenTask.callAssociatedData);
    // const orderid = this.shadowRoot.getElementById("orderid");
    // orderid.innerHTML = newValue;
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

customElements.define("pay-widget", PayWidget);

// {
//   "comp": "pay-widget",
// "script": "https://oceanic-puzzling-globe.glitch.me/payment.js",
// "attributes":{
// "btncolour" : "#0045A0"
// },
// "properties":  {
// "customerPrefix": "gen",
// "currentTask": "$STORE.agentContact.taskSelected",
// "triggerPaymentWebhookURL" : "https://hooks.imiconnect.eu/events/TRROTLH8B3",
// "checkPaymentSyncWebhookURL" : "https://hooks.imiconnect.eu/syncwebhook/7XUOL0N0BK",
// "syncWebhookKey" : "c3683c03-9a40-11ec-9d17-0aaac5b19840",
// "pollInterval" : "10000",
// "maxAttempts" : "5"
//   }
