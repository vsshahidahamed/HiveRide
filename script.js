// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyC955U9CGs0-aAcS0hgSFQgvDlwOK1SRnA",
    authDomain: "flutter-bus-hiveride.firebaseapp.com",
    databaseURL: "https://flutter-bus-hiveride-default-rtdb.firebaseio.com",
    projectId: "flutter-bus-hiveride",
    storageBucket: "flutter-bus-hiveride.firebasestorage.app",
    messagingSenderId: "185743407069",
    appId: "1:185743407069:web:7b9c33f8e25b8966d62834"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const db = firebase.database();
let currentUserRole = null; // Stores the current user's role

// --- 🌐 MAP & TRACKING FUNCTIONS ---
let map;
let busMarkers = {};

function initMap() {
    if (map) return;
    map = L.map('map').setView([12.9165, 79.1325], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function trackAllBuses() {
    const busesRef = db.ref("buses");
    busesRef.on("value", snapshot => {
        const buses = snapshot.val();
        if (!buses) return;
        for (let busId in buses) {
            const { latitude, longitude } = buses[busId];
            updateBusMarker(busId, latitude, longitude);
        }
    });
}

function updateBusMarker(busId, lat, lng) {
    if (busMarkers[busId]) {
        busMarkers[busId].setLatLng([lat, lng]);
    } else {
        busMarkers[busId] = L.marker([lat, lng]).addTo(map)
            .bindPopup(`<b>Bus: ${busId}</b>`);
    }
}
const driverTableBody = document.getElementById("driverTableBody");

// Listen for drivers in Firebase
db.ref("drivers").on("value", (snapshot) => {
  driverTableBody.innerHTML = "";
  snapshot.forEach((child) => {
    let driver = child.val();
    let key = child.key;

    let row = document.createElement("tr");

    row.innerHTML = `
      <td contenteditable="false">${driver.name}</td>
      <td contenteditable="false">${driver.busNo}</td>
      <td contenteditable="false">${driver.route}</td>
      <td class="actionCell" style="display:none;">
        <button onclick="editDriver('${key}', this)">Edit</button>
        <button onclick="deleteDriver('${key}')">Delete</button>
      </td>
    `;

    driverTableBody.appendChild(row);
  });

  // If admin is logged in → show action column
  if (userRole === "admin") {
    document.getElementById("actionHeader").style.display = "block";
    document.querySelectorAll(".actionCell").forEach(cell => {
      cell.style.display = "block";
    });
  }
});

// Add Driver (same as before)
const driverForm = document.getElementById("driverForm");
if (driverForm) {
  driverForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let name = document.getElementById("driverName").value;
    let busNo = document.getElementById("busNo").value;
    let route = document.getElementById("route").value;

    db.ref("drivers").push({ name, busNo, route });

    driverForm.reset();
  });
}

// Edit Driver
function editDriver(key, btn) {
  let row = btn.parentElement.parentElement;
  let tds = row.querySelectorAll("td");

  if (btn.innerText === "Edit") {
    // Enable editing
    tds[0].contentEditable = "true";
    tds[1].contentEditable = "true";
    tds[2].contentEditable = "true";
    btn.innerText = "Save";
  } else {
    // Save to Firebase
    let updated = {
      name: tds[0].innerText,
      busNo: tds[1].innerText,
      route: tds[2].innerText
    };

    db.ref("drivers/" + key).set(updated);
    tds[0].contentEditable = "false";
    tds[1].contentEditable = "false";
    tds[2].contentEditable = "false";
    btn.innerText = "Edit";
  }
}

// Delete Driver
function deleteDriver(key) {
  if (confirm("Are you sure you want to delete this driver?")) {
    db.ref("drivers/" + key).remove();
  }
}

// --- 👤 AUTHENTICATION FUNCTIONS ---
function toggleAuth() {
    const reg = document.getElementById("register-section");
    const log = document.getElementById("login-section");
    reg.style.display = reg.style.display === "none" ? "block" : "none";
    log.style.display = log.style.display === "none" ? "block" : "none";
}

function register() {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;
    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        return db.ref("users/" + cred.user.uid).set({ email, role });
    }).catch(error => alert(error.message));
}
const allowedAdmins = [
    { email: "admin1@example.com", password: "admin123" },
    { email: "admin2@example.com", password: "admin123" },
    { email: "admin3@example.com", password: "admin123" }
];


   
     // Check if admin
    function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // ✅ Only these Admins are allowed
    const allowedAdmins = [
        "admin1@gmail.com",
        "admin2@gmail.com",
        "admin3@gmail.com",
        "admin4@gmail.com"
    ];

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const uid = userCredential.user.uid;

            // ✅ Check if this email is in allowed Admins
            if (allowedAdmins.includes(email)) {
                document.getElementById("user-role").innerText = "Admin";
                document.getElementById("admin-controls").style.display = "block";
                document.getElementById("dashboard").style.display = "block";
                document.getElementById("auth-section").style.display = "none";
                return;
            }

            // ❌ If not in allowed list → normal user/student
            firebase.database().ref("users/" + uid).once("value")
                .then(snapshot => {
                    if (snapshot.exists()) {
                        const role = snapshot.val().role || "User";
                        document.getElementById("user-role").innerText = role;

                        if (role === "Admin") {
                            alert("❌ You are not in the official Admin list!");
                            firebase.auth().signOut();
                            return;
                        }

                        document.getElementById("admin-controls").style.display = "none";
                        document.getElementById("dashboard").style.display = "block";
                        document.getElementById("auth-section").style.display = "none";
                    } else {
                        alert("User role not found in database.");
                        firebase.auth().signOut();
                    }
                });
        })
        .catch((error) => {
            alert(error.message);
        });
}


function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        db.ref("users/" + user.uid).set({ email: user.email, role: "student" });
    }).catch(error => alert("Google Sign-in error: " + error.message));
}

function logout() {
    auth.signOut();
    currentUserRole = null;
}


// --- 🚗 DRIVER FUNCTIONS ---
function sendLocation() {
    const busNo = document.getElementById("busNumber").value;
    if (!busNo) {
        return alert("Bus number not assigned. Please contact admin.");
    }
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                db.ref("buses/" + busNo).set({ latitude, longitude });
                document.getElementById("location-status").innerText =
                    `✅ Location sent for ${busNo} at ${new Date().toLocaleTimeString()}`;
            },
            error => {
                document.getElementById("location-status").innerText =
                    `Error: ${error.message}`;
            }, { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocation is not available in your browser.");
    }
}


// --- 👨‍🎓 STUDENT & GENERAL FUNCTIONS ---
function loadBusList() {
    db.ref("busDetails").once("value", snap => {
        const selector = document.getElementById("bus-selector");
        selector.innerHTML = '<option value="">Select a bus to view</option>';
        snap.forEach(child => {
            const option = document.createElement("option");
            option.value = child.key;
            option.text = `${child.key} - ${child.val().route}`;
            selector.appendChild(option);
        });
    });
}

function showBusDetails() {
    const busNo = document.getElementById("bus-selector").value;
    if (!busNo) {
        document.getElementById("bus-info").innerHTML = "";
        return;
    }
    db.ref("busDetails/" + busNo).once("value", snap => {
        const info = snap.val();
        document.getElementById("bus-info").innerHTML = `
      <p><b>Bus:</b> ${busNo}</p>
      <p><b>Route:</b> ${info.route}</p>
      <p><b>Driver:</b> ${info.driverName}</p>
      <p><b>Phone:</b> ${info.driverPhone}</p>
    `;
    });
}

document.getElementById("bus-selector").addEventListener("change", function() {
    let selectedBus = this.value;
    showBusDetails();
    if (selectedBus && busMarkers[selectedBus]) {
        map.setView(busMarkers[selectedBus].getLatLng(), 15);
        busMarkers[selectedBus].openPopup();
    }
});


// --- ⚙️ ADMIN & SCHEDULE FUNCTIONS ---
function editBusDetails() {
    const busNo = document.getElementById("bus-edit-number").value;
    const route = document.getElementById("bus-edit-route").value;
    const name = document.getElementById("bus-edit-driver").value;
    const phone = document.getElementById("bus-edit-phone").value;
    if (busNo && route && name && phone) {
        db.ref("busDetails/" + busNo).set({
            route: route,
            driverName: name,
            driverPhone: phone
        });
        alert("Bus details updated successfully.");
    } else {
        alert("Please fill all bus detail fields.");
    }
}

function addSchedule() {
    const busNo = document.getElementById("bus-no").value;
    const route = document.getElementById("bus-route").value;
    const morning = document.getElementById("morning-time").value;
    const evening = document.getElementById("evening-time").value;
    const driver = document.getElementById("driver-name").value;
    const mobile = document.getElementById("driver-mobile").value;

    if (!busNo || !route || !morning || !evening || !driver || !mobile) {
        alert("⚠️ Please fill all fields!");
        return;
    }

    db.ref("schedule").push().set({
        busNo, route, morning, evening, driver, mobile
    }).then(() => {
        alert("Schedule added successfully!");
        document.getElementById("bus-no").value = "";
        document.getElementById("bus-route").value = "";
        document.getElementById("morning-time").value = "";
        document.getElementById("evening-time").value = "";
        document.getElementById("driver-name").value = "";
        document.getElementById("driver-mobile").value = "";
    });
}

function loadSchedule() {
    const scheduleRef = db.ref("schedule");
    scheduleRef.on("value", (snapshot) => {
        const data = snapshot.val();
        
        const adminTbody = document.getElementById("schedule-body"); 
        const studentTbody = document.getElementById("schedule-body-student");
        
        if(adminTbody) adminTbody.innerHTML = "";
        if(studentTbody) studentTbody.innerHTML = "";

        if (!data) {
            const noDataHtml = '<tr><td colspan="7">No schedule data available.</td></tr>';
            if(adminTbody) adminTbody.innerHTML = noDataHtml;
            if(studentTbody) studentTbody.innerHTML = noDataHtml;
            return;
        }

        for (let key in data) {
            const item = data[key];
            
            const actionsCell = currentUserRole === 'admin' 
                ? `<td><button onclick="deleteSchedule('${key}')">❌ Delete</button></td>` 
                : '';

            const rowHtmlForAdmin = `
                <td>${item.busNo}</td> <td>${item.route}</td> <td>${item.morning}</td>
                <td>${item.evening}</td> <td>${item.driver}</td> <td>${item.mobile}</td>
                <button onclick="editRow('${key}')">Edit</button>
                ${actionsCell}`;
            
            const rowHtmlForStudent = `
                <td>${item.busNo}</td> <td>${item.route}</td> <td>${item.morning}</td>
                <td>${item.evening}</td> <td>${item.driver}</td> <td>${item.mobile}</td>`;
            
            if(currentUserRole === 'admin' && adminTbody) {
                const tr = document.createElement("tr");
                tr.innerHTML = rowHtmlForAdmin;
                adminTbody.appendChild(tr);
            }
            if(currentUserRole === 'student' && studentTbody) {
                const tr = document.createElement("tr");
                tr.innerHTML = rowHtmlForStudent;
                studentTbody.appendChild(tr);
            }
        }
    });
}

function editRow(key) {
    const scheduleRef = firebase.database().ref("schedules/" + key);
    scheduleRef.once("value").then((snapshot) => {
        const data = snapshot.val();

        if (data) {
            // Example: fill into input fields for editing
            document.getElementById("busNo").value = data.busNo;
            document.getElementById("route").value = data.route;
            document.getElementById("morning").value = data.morning;
            document.getElementById("evening").value = data.evening;
            document.getElementById("driver").value = data.driver;
            document.getElementById("mobile").value = data.mobile;

            // Save which row is being edited
            document.getElementById("scheduleForm").setAttribute("data-edit-id", key);
        }
    });
}

function saveSchedule() {
  const busNo = document.getElementById("busNo").value;
  const route = document.getElementById("route").value;
  const morning = document.getElementById("morning").value;
  const evening = document.getElementById("evening").value;
  const driver = document.getElementById("driver").value;
  const mobile = document.getElementById("mobile").value;

  const scheduleForm = document.getElementById("scheduleForm");
  const editKey = scheduleForm.getAttribute("data-edit-id");

  if (editKey) {
    // Update existing schedule
    firebase.database().ref("schedules/" + editKey).update({
      busNo, route, morning, evening, driver, mobile
    });
    scheduleForm.removeAttribute("data-edit-id"); // clear after saving
  } else {
    // Add new schedule
    firebase.database().ref("schedules").push({
      busNo, route, morning, evening, driver, mobile
    });
  }

  scheduleForm.reset(); // clear form after save
}

function deleteSchedule(key) {
    if (confirm("Are you sure you want to delete this schedule entry?")) {
        db.ref("schedule/" + key).remove();
    }
}

function saveStudent() {
    const roll = document.getElementById("student-roll").value;
    const name = document.getElementById("student-name").value;
    const route = document.getElementById("student-route").value;
    const year = document.getElementById("student-year").value;
    const balance = document.getElementById("student-balance").value;

    firebase.database().ref("students/" + roll).set({
        rollNo: roll,
        name: name,
        route: route,
        year: year,
        balance: balance
    }).then(() => {
        alert("Student saved successfully!");
    }).catch((error) => {
        alert("Error: " + error.message);
    });
}

function searchStudent() {
    const roll = document.getElementById("search-roll").value;

    firebase.database().ref("students/" + roll).once("value").then((snapshot) => {
        const student = snapshot.val();
        if (student) {
            document.getElementById("student-info-result").innerHTML = `
                <p><strong>Name:</strong> ${student.name}</p>
                <p><strong>Route:</strong> ${student.route}</p>
                <p><strong>Year:</strong> ${student.year}</p>
                <p><strong>Balance:</strong> ₹${student.balance}</p>
                <button onclick="deleteStudent('${roll}')">Delete</button>
            `;
        } else {
            document.getElementById("student-info-result").innerHTML = "Student not found.";
        }
    });
}

function deleteStudent(roll) {
    if (confirm("Are you sure you want to delete this student?")) {
        firebase.database().ref("students/" + roll).remove().then(() => {
            alert("Student deleted.");
            document.getElementById("student-info-result").innerHTML = "";
        });
    }
}

function checkMyFees() {
    const roll = document.getElementById("student-search-roll").value;

    firebase.database().ref("students/" + roll).once("value").then((snapshot) => {
        const student = snapshot.val();
        if (student) {
            document.getElementById("my-fees-info").innerHTML = `
                <p><strong>Name:</strong> ${student.name}</p>
                <p><strong>Route:</strong> ${student.route}</p>
                <p><strong>Year:</strong> ${student.year}</p>
                <p><strong>Balance:</strong> ₹${student.balance}</p>
            `;
        } else {
            document.getElementById("my-fees-info").innerHTML = "No record found.";
        }
    });
}
// Save Student
    document.getElementById("saveBtn").addEventListener("click", () => {
      let year = document.getElementById("year").value;
      let roll = document.getElementById("roll").value;
      let name = document.getElementById("name").value;
      let route = document.getElementById("route").value;
      let balance = document.getElementById("balance").value;

      if(!year || !roll || !name || !route || !balance){
        alert("⚠️ Please fill all fields");
        return;
      }

      // Use year + roll together as document ID
      let docId = year + "_" + roll;

      db.collection("students").doc(docId).set({
        year: year,
        roll: roll,
        name: name,
        route: route,
        balance: balance
      }).then(() => {
        alert("✅ Student Saved!");
      }).catch((error) => {
        console.error("Error: ", error);
      });
    });

    // Search Student
    document.getElementById("searchBtn").addEventListener("click", () => {
      let roll = document.getElementById("searchRoll").value;
      if(!roll){
        alert("⚠️ Please enter Roll No");
        return;
      }

      // Search all students for this roll 
        // Search all students for this roll
  firebase.database().ref("students").once("value").then((snapshot) => {
    let found = false;
    let resultText = "";

    snapshot.forEach(child => {
      let data = child.val();
      if (data.roll === roll) {
        found = true;
        resultText += 
          "📅 Year: " + data.year + "<br>" +
          "🎓 Name: " + data.name + "<br>" +
          "🚌 Route: " + data.route + "<br>" +
          "💰 Balance: " + data.balance + "<br><hr>";
      }
    });

    document.getElementById("result").innerHTML = 
      found ? resultText : "❌ Student not found!";
  });
});

// ✅ NEW: Functions for Managing Routes
function addRoute() {
    const route = document.getElementById("route-name").value;
    const distance = document.getElementById("route-distance").value;
    const fee = document.getElementById("route-fee").value;

    if (!route || !distance || !fee) {
        alert("⚠️ Please fill all fields!");
        return;
    }

    const routeRef = db.ref("routes").push();
    routeRef.set({
        route,
        distance,
        fee
    });

    document.getElementById("route-name").value = "";
    document.getElementById("route-distance").value = "";
    document.getElementById("route-fee").value = "";
}

function loadRoutes() {
    const routeRef = db.ref("routes");
    routeRef.on("value", (snapshot) => {
        const data = snapshot.val();
        const tbody = document.getElementById("fees-body");
        tbody.innerHTML = "";

        for (let key in data) {
            const item = data[key];
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${item.route}</td>
                <td>${item.distance} km</td>
                <td>₹${item.fee}</td>
                <td>
                    <button onclick="editRow('${key}')">Edit</button>
                    <button onclick="deleteRoute('${key}')">❌ Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });
}

function deleteRoute(key) {
    if (confirm("Are you sure you want to delete this route?")) {
        db.ref("routes/" + key).remove();
    }
}

function loadRoutes() {
    db.ref("routes").on("value", snapshot => {
        const data = snapshot.val();
        const adminTbody = document.getElementById("fees-body");
        const studentTbody = document.getElementById("fees-body-student");

        if (adminTbody) adminTbody.innerHTML = "";
        if (studentTbody) studentTbody.innerHTML = "";

        if (!data) return;

        for (let key in data) {
            const item = data[key];

            // Admin (editable)
            if (adminTbody && currentUserRole === "admin") {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${item.route}</td>
                    <td>${item.distance}</td>
                    <td>${item.fee}</td>
                    <td>
                        <button onclick="editRoute('${key}')">Edit</button>
                        <button onclick="deleteRoute('${key}')">❌ Delete</button>
                    </td>
                `;
                adminTbody.appendChild(tr);
            }

            // Student (view-only)
            if (studentTbody && currentUserRole === "student") {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${item.route}</td>
                    <td>${item.distance}</td>
                    <td>${item.fee}</td>
                `;
                studentTbody.appendChild(tr);
            }
        }
    });
}

// Add or update student
function addOrUpdateStudent() {
  const rollNo = document.getElementById("rollNo").value.trim();
  const name = document.getElementById("name").value.trim();
  const route = document.getElementById("route").value.trim();
  const balance = parseFloat(document.getElementById("balance").value);

  if (!rollNo || !name || !route || isNaN(balance)) {
    alert("Please fill all fields correctly");
    return;
  }

  db.ref(`students/${rollNo}`).set({ name, route, balance });
  db.ref(`users/${rollNo}`).set({ role: "Student", rollNo });
  alert("Student added/updated successfully");
  clearForm();
}

// Clear input form
function clearForm() {
  document.getElementById("rollNo").value = "";
  document.getElementById("name").value = "";
  document.getElementById("route").value = "";
  document.getElementById("balance").value = "";
}

// Admin search
function searchStudent() {
  const roll = document.getElementById("searchRoll").value.trim();
  const resultDiv = document.getElementById("searchResult");

  db.ref(`students/${roll}`).once('value').then(snapshot => {
    const s = snapshot.val();
    if (s) {
      resultDiv.innerHTML = `Name: ${s.name} <br> Route: ${s.route} <br> Balance: ₹${s.balance}`;
    } else {
      resultDiv.innerHTML = "Student not found";
    }
  });
}

// Student search
function studentSearch() {
  const roll = document.getElementById("studentSearchRoll").value.trim();
  const resultDiv = document.getElementById("studentResult");

  db.ref(`students/${roll}`).once('value').then(snapshot => {
    const s = snapshot.val();
    if (s) {
      resultDiv.innerHTML = `Name: ${s.name} <br> Route: ${s.route} <br> Balance: ₹${s.balance}`;
    } else {
      resultDiv.innerHTML = "Student not found";
    }
  });
}

// --- 🔥 MAIN APP LOGIC (AUTH STATE CHANGE) ---
auth.onAuthStateChanged(user => {
    const authSection = document.getElementById("auth-section");
    const dashboard = document.getElementById("dashboard");
    const adminControls = document.getElementById("admin-controls");
    const driverLocation = document.getElementById("driver-location");
    const mapSection = document.getElementById("map-section");
    const studentInfo = document.getElementById("student-info-section");

    if (user) {
        authSection.style.display = "none";
        dashboard.style.display = "block";
        db.ref("users/" + user.uid).once("value").then(snapshot => {
            if (!snapshot.exists()) return;

            const { role, email } = snapshot.val();
            currentUserRole = role; 
            document.getElementById("user-role").innerText = `Role: ${role}`;

            adminControls.style.display = "none";
            driverLocation.style.display = "none";
            studentInfo.style.display = "none";
            mapSection.style.display = "none";

            if (role === "admin") {
                adminControls.style.display = "block";
                mapSection.style.display = "block";
                initMap();
                trackAllBuses();
                loadBusList();
                loadSchedule();
                loadRoutes(); // ✅ NEW: Load routes for admin
            } else if (role === "student") {
                studentInfo.style.display = "block";
                mapSection.style.display = "block";
                initMap();
                trackAllBuses();
                loadBusList();
                loadSchedule(); 
            } else if (role === "driver") {
                driverLocation.style.display = "block";
                db.ref("driverAssignments").orderByValue().equalTo(email).once("value", snap => {
                    if (snap.exists()) {
                        snap.forEach(child => {
                            document.getElementById("driver-bus-no").innerText = `Your Bus: ${child.key}`;
                            document.getElementById("busNumber").value = child.key;
                        });
                    } else {
                        document.getElementById("driver-bus-no").innerText = "No bus assigned.";
                    }
                });
            }
        });
    } else {
        authSection.style.display = "block";
        dashboard.style.display = "none";
        currentUserRole = null;
    }
});
