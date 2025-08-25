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

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// ---------------- AUTH ----------------

function toggleAuth() {
  document.getElementById("register-section").style.display =
    document.getElementById("register-section").style.display === "none"
      ? "block"
      : "none";
  document.getElementById("login-section").style.display =
    document.getElementById("login-section").style.display === "none"
      ? "block"
      : "none";
}

function register() {
  const email = document.getElementById("reg-email").value;
  const pass = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      return db.ref("users/" + cred.user.uid).set({ email, role });
    })
    .then(() => alert("✅ Registered successfully"))
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => console.log("Logged in"))
    .catch(err => alert(err.message));
}

function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        // Set new users from Google Sign-In to "student" role by default
        db.ref("users/" + user.uid).set({
            email: user.email,
            role: "student"
        });
    }).catch(error => alert("Google Sign-in error: " + error.message));
}

function logout() {
  auth.signOut();
}

// ---------------- ROLE DASHBOARD ----------------

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    db.ref("users/" + user.uid).once("value").then(snap => {
      const role = snap.val().role;
      document.getElementById("user-role").innerText = role.toUpperCase();

      // Default hide all
      document.getElementById("studentSection").style.display = "none";
      document.getElementById("adminSection").style.display = "none";
      document.getElementById("driverSection").style.display = "none";

      if (role === "student") {
        document.getElementById("studentSection").style.display = "block";

        // 🔒 Disable editing features for students
        document.querySelectorAll(".admin-only, .driver-only").forEach(el => {
          el.style.display = "none";
        });

      } else if (role === "admin") {
        document.getElementById("adminSection").style.display = "block";
      } else if (role === "driver") {
        document.getElementById("driverSection").style.display = "block";
      }
    });
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

// ---------------- ADMIN: BUS SCHEDULE ----------------

function addSchedule() {
  const busNo = document.getElementById("bus-no").value;
  const route = document.getElementById("bus-route").value;
  const morning = document.getElementById("morning-time").value;
  const evening = document.getElementById("evening-time").value;
  const driver = document.getElementById("driver-name").value;
  const mobile = document.getElementById("driver-mobile").value;

  db.ref("schedules/" + busNo).set({ route, morning, evening, driver, mobile });
  clearScheduleForm();
}

function editSchedule(busNo) {
  db.ref("schedules/" + busNo).once("value").then(snap => {
    if (snap.exists()) {
      const s = snap.val();
      document.getElementById("bus-no").value = busNo;
      document.getElementById("bus-route").value = s.route;
      document.getElementById("morning-time").value = s.morning;
      document.getElementById("evening-time").value = s.evening;
      document.getElementById("driver-name").value = s.driver;
      document.getElementById("driver-mobile").value = s.mobile;
    }
  });
}

function clearScheduleForm() {
  document.getElementById("bus-no").value = "";
  document.getElementById("bus-route").value = "";
  document.getElementById("morning-time").value = "";
  document.getElementById("evening-time").value = "";
  document.getElementById("driver-name").value = "";
  document.getElementById("driver-mobile").value = "";
}


db.ref("schedules").on("value", snap => {
  let body = "";
  snap.forEach(child => {
    const s = child.val();
    body += `<tr>
      <td>${child.key}</td>
      <td>${s.route}</td>
      <td>${s.morning}</td>
      <td>${s.evening}</td>
      <td>${s.driver}</td>
      <td>${s.mobile}</td>
      <td><button onclick="editSchedule('${child.key}')">✏️Edit</button></td>
      
    </tr>`;
  });
  document.getElementById("schedule-body").innerHTML = body;
  document.getElementById("schedule-body-student").innerHTML = body;
});

function deleteSchedule(busNo) {
  db.ref("schedules/" + busNo).remove();
}

// ---------------- ADMIN: ROUTES & FEES ----------------

function addRoute() {
  const route = document.getElementById("route-name").value;
  const distance = document.getElementById("route-distance").value;
  const fee = document.getElementById("route-fee").value;

  db.ref("routes/" + route).set({ distance, fee });
  clearRouteForm();
}

function editRoute(route) {
  db.ref("routes/" + route).once("value").then(snap => {
    if (snap.exists()) {
      const r = snap.val();
      document.getElementById("route-name").value = route;
      document.getElementById("route-distance").value = r.distance;
      document.getElementById("route-fee").value = r.fee;
    }
  });
}

function clearRouteForm() {
  document.getElementById("route-name").value = "";
  document.getElementById("route-distance").value = "";
  document.getElementById("route-fee").value = "";
}

db.ref("routes").on("value", snap => {
  let body = "";
  snap.forEach(child => {
    const r = child.val();
    body += `<tr>
      <td>${child.key}</td>
      <td>${r.distance}</td>
      <td>${r.fee}</td>
      <td><button onclick="editRoute('${child.key}')">✏️Edit</button></td>
      
    </tr>`;
  });
  document.getElementById("fees-body").innerHTML = body;
  document.getElementById("fees-body-student").innerHTML = body;
});

function deleteRoute(route) {
  db.ref("routes/" + route).remove();
}

// ---------------- ADMIN: STUDENTS ----------------

function saveStudent() {
  const roll = document.getElementById("student-roll").value;
  const name = document.getElementById("student-name").value;
  const route = document.getElementById("student-route").value;
  const year = document.getElementById("student-year").value;
  const balance = document.getElementById("student-balance").value;

  db.ref("students/" + roll).set({ name, route, year, balance });
}

function searchStudent() {
  const roll = document.getElementById("searchRoll").value;
  db.ref("students/" + roll).once("value").then(snap => {
    if (snap.exists()) {
      const s = snap.val();
      document.getElementById("studentDetails").innerText =
        `Roll: ${roll}\nName: ${s.name}\nRoute: ${s.route}\nYear: ${s.year}\nBalance: ₹${s.balance}`;
    } else {
      document.getElementById("studentDetails").innerText = "❌ No record";
    }
  });
}

// ---------------- STUDENT: CHECK FEES ----------------

function checkMyFees() {
  const roll = document.getElementById("student-search-roll").value;
  db.ref("students/" + roll).once("value").then(snap => {
    if (snap.exists()) {
      const s = snap.val();
      document.getElementById("my-fees-info").innerText =
        `Name: ${s.name}\nRoute: ${s.route}\nYear: ${s.year}\nBalance Fee: ₹${s.balance}`;
    } else {
      document.getElementById("my-fees-info").innerText = "❌ No record found";
    }
  });
}

// ---------------- ADMIN: DRIVERS ----------------

function addDriver() {
  const name = document.getElementById("driverName").value;
  const busNo = document.getElementById("busNo").value;
  const route = document.getElementById("route").value;

  db.ref("drivers/" + name).set({ busNo, route });
  clearDriverForm();
}

function editDriver(name) {
  db.ref("drivers/" + name).once("value").then(snap => {
    if (snap.exists()) {
      const d = snap.val();
      document.getElementById("driverName").value = name;
      document.getElementById("busNo").value = d.busNo;
      document.getElementById("route").value = d.route;
    }
  });
}

function clearDriverForm() {
  document.getElementById("driverName").value = "";
  document.getElementById("busNo").value = "";
  document.getElementById("route").value = "";
}

db.ref("drivers").on("value", snap => {
  let body = "";
  snap.forEach(child => {
    const d = child.val();
    body += `<tr>
      <td>${child.key}</td>
      <td>${d.busNo}</td>
      <td>${d.route}</td>
      <td><button onclick="editDriver('${child.key}')">✏️Edit</button></td>
      
    </tr>`;
  });
  document.getElementById("driverTableBody").innerHTML = body;
});

function deleteDriver(name) {
  db.ref("drivers/" + name).remove();
}

// ---------------- DRIVER: LIVE LOCATION ----------------

function sendLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      db.ref("liveLocations/driver1").set({ lat, lng, time: Date.now() });
      document.getElementById("location-status").innerText =
        `📍 Sent: ${lat}, ${lng}`;
    });
  } else {
    alert("Geolocation not supported");
  }
}

let map;
let busMarkers = {}; // store markers by bus number
// --- 🌐 MAP & TRACKING FUNCTIONS ---
function initMap() {
    if (map) return;
    map = L.map('map').setView([12.9165, 79.1325], 12); // Vellore, India coordinates
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

    // ✅ Marker for selected bus
    let activeMarker = null;

    // ✅ Populate dropdown with bus list
    const busRef = db.ref("buses");

    busRef.on("value", (snapshot) => {
      const buses = snapshot.val();
      const busSelect = document.getElementById("busSelect");

      // Clear old options
      busSelect.innerHTML = `<option value="">--Choose Bus--</option>`;

      for (let busId in buses) {
        let option = document.createElement("option");
        option.value = busId;
        option.textContent = "Bus " + busId;
        busSelect.appendChild(option);
      }
    });

    // ✅ When user selects a bus
    document.getElementById("busSelect").addEventListener("change", (e) => {
      const selectedBus = e.target.value;

      if (!selectedBus) {
        if (activeMarker) {
          map.removeLayer(activeMarker);
          activeMarker = null;
        }
        return;
      }

      // Listen to only that bus
      db.ref("buses/" + selectedBus).on("value", (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const { lat, lng } = data;

        if (activeMarker) {
          activeMarker.setLatLng([lat, lng]);
        } else {
          activeMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup(`Bus ${selectedBus}`);
        }

        map.setView([lat, lng], 15); // Center map on bus
      });
    });

// Init
window.onload = function () {
  initMap();
  loadBusLocations();
};
