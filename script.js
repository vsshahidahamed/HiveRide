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
  auth.signInWithPopup(provider)
    .then(result => {
      db.ref("users/" + result.user.uid).once("value").then(snap => {
        if (!snap.exists()) {
          db.ref("users/" + result.user.uid).set({
            email: result.user.email,
            role: "student"
          });
        }
      });
    })
    .catch(err => alert(err.message));
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

      document.getElementById("studentSection").style.display = (role === "student") ? "block" : "none";
      document.getElementById("adminSection").style.display = (role === "admin") ? "block" : "none";
      document.getElementById("driverSection").style.display = (role === "driver") ? "block" : "none";
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
      <td><button onclick="deleteSchedule('${child.key}')">❌</button></td>
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
}

db.ref("routes").on("value", snap => {
  let body = "";
  snap.forEach(child => {
    const r = child.val();
    body += `<tr>
      <td>${child.key}</td>
      <td>${r.distance}</td>
      <td>${r.fee}</td>
      <td><button onclick="deleteRoute('${child.key}')">❌</button></td>
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
}

db.ref("drivers").on("value", snap => {
  let body = "";
  snap.forEach(child => {
    const d = child.val();
    body += `<tr>
      <td>${child.key}</td>
      <td>${d.busNo}</td>
      <td>${d.route}</td>
      <td><button onclick="deleteDriver('${child.key}')">❌</button></td>
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

function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5); // India center
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

// Load all buses and update markers
function loadBusLocations() {
  firebase.database().ref("busLocations").on("value", snapshot => {
    // Remove old markers
    Object.values(busMarkers).forEach(marker => map.removeLayer(marker));
    busMarkers = {};

    snapshot.forEach(bus => {
      let data = bus.val();
      if (data.lat && data.lng) {
        let marker = L.marker([data.lat, data.lng]).bindPopup(
          `🚌 ${bus.key}<br>Driver: ${data.driver}`
        );
        busMarkers[bus.key] = marker;

        // If "All" selected → show all markers
        if (document.getElementById("busSelect").value === "all") {
          marker.addTo(map);
        }
      }
    });
  });
}

// Filter by selected bus
document.getElementById("busSelect").addEventListener("change", e => {
  let selected = e.target.value;

  // Remove all markers first
  Object.values(busMarkers).forEach(marker => map.removeLayer(marker));

  if (selected === "all") {
    // show all buses
    Object.values(busMarkers).forEach(marker => marker.addTo(map));
  } else if (busMarkers[selected]) {
    // show only selected bus
    busMarkers[selected].addTo(map);
    map.setView(busMarkers[selected].getLatLng(), 13);
  }
});

// Init
window.onload = function () {
  initMap();
  loadBusLocations();
};
