const style = document.createElement("style");
const template = document.createElement("template");
style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");


      table{
         border: 1px solid black;
      }

      .mylabel {
         width:281px;
         height:50px;
         display: inline-block; 
      }
      .row {
         display: flex;
      }

      /* Create two equal columns that sits next to each other */
      .column {
         width: 50;
         padding: 0px;
      }          
      .onoffswitch {
        position: relative; width: 90px;
          -webkit-user-select:none; -moz-user-select:none; -ms-user-select: none;
      }    
      .onoffswitch-checkbox {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .onoffswitch-label {
        display: block; overflow: hidden; cursor: pointer;
        border: 2px solid #044650; border-radius: 20px;
      }
      .onoffswitch-inner {
        display: block; width: 200%; margin-left: -100%;
        transition: margin 0.3s ease-in 0s;
      }
      .onoffswitch-inner:before, .onoffswitch-inner:after {
        display: block; float: left; width: 50%; height: 30px; padding: 0; line-height: 30px;
        font-size: 14px; color: white; font-family: Trebuchet, Arial, sans-serif; font-weight: bold;
        box-sizing: border-box;
      }
      .onoffswitch-inner:before {
        content: "ON";
        padding-left: 10px;
        background-color: #34A7C1; color: #FFFFFF;
      }
      .onoffswitch-inner:after {
        content: "OFF";
        padding-right: 10px;
        background-color: #044650; color: #999999;
        text-align: right;
      }
      .onoffswitch-switch {
        display: block; width: 18px; margin: 6px;
        background: #FFFFFF;
        position: absolute; top: 0; bottom: 0;
        right: 56px;
        border: 2px solid #044650; border-radius: 20px;
        transition: all 0.3s ease-in 0s;
      }
      .onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-inner {
        margin-left: 0;
      }
      .onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-switch {
        right: 0px;
      }          

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
template.innerHTML = `
    <div class="row">
      <div class="column" style="padding:10px">
        <div id="table-container"></div>   
      </div>
      <div class="column" style="padding:10px">
         <div id="table-container-string"></div>      
      </div>
    </div>
      <div class="column">
        <div id="table-container-mobile"></div>   
        <div id="mobile-table-container-string"></div>   
      </div>
    <label class="mylabel" id="submitted"></label>`;

class SupervisorControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.timeoutID = undefined;
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.appendChild(style);

    var agentEditable = [];
    var variableType = [];
    var agentViewable = [];
    var reportable = [];
    var active = [];
    var defaultValue = [];
    var gvid = [];
    var gvname = [];
    var checkboxname = [];
    var submitname = [];
    var textareaname = [];
    var remainingname = [];
    var description = [];
    var savedtext = [];

    var org = this.orgId;

    var context = this.shadowRoot;
    var username = this.User;
    var passphrase = this.passPhrase;
    var access_token;
    var triggerurl = "<Your Trigger URL>";
    var tokenname = "<Your token name>";

    //Get Global Variables
    GetAccessToken();

    function GetAccessToken() {
      const myHeaders = new Headers();
      myHeaders.append("x-token-passphrase", passphrase);

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      console.log(requestOptions);

      fetch(triggerurl + "?name=" + tokenname, requestOptions)
        .then((response) => response.text())
        .then((result) => GetGlobalVariables(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function GetGlobalVariables(result) {
      var searchstring;
      access_token = result.token;

      if (username == null) {
        searchstring = "";
      } else {
        searchstring = "?search=" + username;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + access_token);

      const raw = JSON.stringify({});

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      console.log(requestOptions);

      fetch(
        "https://api.wxcc-eu1.cisco.com/organization/" +
          org +
          "/v2/cad-variable" +
          searchstring,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => GotVariables(JSON.parse(result), context))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function GotVariables(result, context) {
      var booleandata = [];
      var stringdata = [];

      for (let i = 0; i < result.meta.totalRecords; i++) {
        agentEditable[i] = result.data[i].agentEditable;
        variableType[i] = result.data[i].variableType;
        agentViewable[i] = result.data[i].agentViewable;
        reportable[i] = result.data[i].reportable;
        active[i] = result.data[i].active;
        defaultValue[i] = result.data[i].defaultValue;
        gvid[i] = result.data[i].id;
        gvname[i] = result.data[i].name;
        savedtext[i] = result.data[i].defaultValue;
        checkboxname[i] = "checkbox" + i;
        submitname[i] = "submit" + i;
        textareaname[i] = "textarea" + i;
        remainingname[i] = "remaining" + i;
        description[i] = result.data[i].description;

        if (
          description[i] == "" ||
          description[i] === undefined ||
          description[i] == null
        ) {
          description[i] = gvname[i];
        }

        if (result.data[i].variableType == "Boolean") {
          booleandata.push({
            name: description[i],
            Value: defaultValue[i],
            CheckName: checkboxname[i],
            SubmitName: submitname[i],
          });
        }
        if (result.data[i].variableType == "String") {
          stringdata.push({
            name: description[i],
            Value: defaultValue[i],
            TextAreaName: textareaname[i],
            SubmitName: submitname[i],
            RemainingName: remainingname[i],
          });
        }
      }

      const tableContainer = context.getElementById("table-container");
      tableContainer.innerHTML = generateTable(booleandata);
      const stringtableContainer = context.getElementById(
        "table-container-string"
      );
      stringtableContainer.innerHTML = generateTableString(stringdata);

      // Initialise character count
      for (let i = 0; i < result.meta.totalRecords; i++) {
        if (variableType[i] == "String") {
          var spanid = context.getElementById(remainingname[i]);
          var textareaid = context.getElementById(textareaname[i]);
          var textarealength = textareaid.value.length;
          spanid.innerHTML = textarealength + "/256";
        }
      }
    }

    function generateTable(data) {
      let table = '<table style="width:360px">';
      table += "<tr><th>Demo Controls</th></tr>";
      data.forEach((item) => {
        if (item.Value == "true") {
          table += `<tr><td>${item.name}</td><td><div class="onoffswitch"><input type=checkbox onclick="checkboxticked(id)" class="onoffswitch-checkbox" tabindex="0" checked id=${item.CheckName}><label class="onoffswitch-label" for=${item.CheckName}><span class="onoffswitch-inner"></span><span class="onoffswitch-switch"></span></label></td></div><td><button onclick="submitticked(id)" style="background-color:lightgrey" id=${item.SubmitName} disabled>Apply</button></td><td></td></tr>`;
        } else {
          table += `<tr><td>${item.name}</td><td><div class="onoffswitch"><input type=checkbox onclick="checkboxticked(id)" class="onoffswitch-checkbox" tabindex="0"  id=${item.CheckName}><label class="onoffswitch-label" for=${item.CheckName}><span class="onoffswitch-inner"></span><span class="onoffswitch-switch"></span></label></td></div><td><button onclick="submitticked(id)" style="background-color:lightgrey" id=${item.SubmitName} disabled>Apply</button></td><td></td></tr>`;
        }
      });
      table += "</table>";
      return table;
    }

    function generateTableString(data) {
      let table = "<table>";
      table += "<tr><th>Messages</th></tr>";
      data.forEach((item) => {
        table += `<tr><td><div>${item.name}</div></td><td><div><textarea  rows="5" cols="60" maxlength="256" id=${item.TextAreaName} >${item.Value}</textarea><span style="font-size: small" id=${item.RemainingName}></span></div></td><td><button onclick="submitticked(id)" style="background-color:lightgrey" id=${item.SubmitName} disabled>Apply</button></td><td></td></tr>`;
      });
      table += "</table>";

      return table;
    }

    context.addEventListener("paste", (e) => {
      let data = e.clipboardData.getData("text/plain");
      //   text.innerHTML = data;
      var textarealength = e.srcElement.value.length + data.length;
      e.srcElement.nextSibling.innerHTML = textarealength + "/256";
    });

    context.addEventListener("keyup", (e) => {
      var textarealength = e.srcElement.value.length;
      e.srcElement.nextSibling.innerHTML = textarealength + "/256";
      StringChanged(e.srcElement);
    });

    context.addEventListener("click", (e) => {
      buttonclicked(e.srcElement);
    });

    function buttonclicked(id) {
      // Get number
      if (id.nodeName == "INPUT") {
        checkboxticked(id);
      } else if (id.nodeName == "BUTTON") {
        submitticked(id);
      }
    }

    function checkboxticked(id) {
      // Get number
      var checkboxid = context.getElementById(id.id);

      var index = id.id.replace(/\D/g, "");
      var submitboxid = context.getElementById("submit" + index);
      submitboxid.style.backgroundColor = "lightgreen";
      submitboxid.disabled = false;

      if (checkboxid.checked == true) {
        defaultValue[index] = "true";
      } else {
        defaultValue[index] = "false";
      }

      if (defaultValue[index] == savedtext[index]) {
        submitboxid.style.backgroundColor = "lightgrey";
        submitboxid.disabled = true;
      } else {
        submitboxid.style.backgroundColor = "lightgreen";
        submitboxid.disabled = false;
      }
    }

    function StringChanged(id) {
      var index = id.id.replace(/\D/g, "");
      var submitboxid = context.getElementById("submit" + index);

      //      if(id.value==savedtext[index] || id.value.length==0) {
      if (id.value == savedtext[index]) {
        submitboxid.style.backgroundColor = "lightgrey";
        submitboxid.disabled = true;
      } else {
        submitboxid.style.backgroundColor = "lightgreen";
        submitboxid.disabled = false;
      }

      defaultValue[index] = id.value;
    }

    function submitticked(id) {
      var submitboxid = context.getElementById(id.id);
      submitboxid.style.backgroundColor = "lightgrey";
      submitboxid.disabled = true;

      var index = id.id.replace(/\D/g, "");
      savedtext[index] = defaultValue[index];

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + access_token);

      const raw = JSON.stringify({
        agentEditable: agentEditable[index],
        variableType: variableType[index],
        agentViewable: agentViewable[index],
        reportable: reportable[index],
        active: active[index],
        defaultValue: defaultValue[index],
        id: gvid[index],
        name: gvname[index],
        description: description[index],
      });

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      console.log(requestOptions);

      fetch(
        "https://api.wxcc-eu1.cisco.com/organization/" +
          org +
          "/cad-variable/" +
          gvid[index],
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => updatelabel(JSON.parse(result)))
        .catch((error) => console.log("[TEXTWIDGET] - ERROR - ", error));
    }

    function updatelabel(result) {
      var submittedboxid = context.getElementById("submitted");

      // Check for errors
      if (result.error) {
        submittedboxid.innerHTML =
          "Error: " + result.error.message[0].description;
      } else {
        submittedboxid.innerHTML =
          "Successfully updated " +
          result.description +
          " to " +
          result.defaultValue;
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Custom element attributes changed. name: ${name}, oldValue: ${oldValue}, newValue: ${newValue}`
    );
    // console.log(this.currenTask.callAssociatedData);
    // const orderid = this.shadowRoot.getElementById("orderid");
    // orderid.innerHTML = newValue;
  }
}

customElements.define("supervisor-controls", SupervisorControls);
