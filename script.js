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


// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUserRole = null;

// 🔄 Toggle Login/Register
function toggleAuth() {
    const reg = document.getElementById("register-section");
    const log = document.getElementById("login-section");
    reg.style.display = reg.style.display === "none" ? "block" : "none";
    log.style.display = log.style.display === "none" ? "block" : "none";
}

// 📝 Register
function register() {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            return db.ref("users/" + cred.user.uid).set({
                email,
                role
            });
        })
        .then(() => alert("Registered successfully!"))
        .catch(err => alert(err.message));
}

// 🔑 Login
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log("Logged in"))
        .catch(err => alert(err.message));
}

// 🔓 Logout
function logout() {
    auth.signOut();
}

// 🔄 Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("users/" + user.uid).once("value").then(snapshot => {
            currentUserRole = snapshot.val().role;
            document.getElementById("auth-section").style.display = "none";
            document.getElementById("dashboard").style.display = "block";
            document.getElementById("user-role").innerText = currentUserRole;

            showDashboardForRole(currentUserRole);
        });
    } else {
        document.getElementById("auth-section").style.display = "block";
        document.getElementById("dashboard").style.display = "none";
    }
});

// 🎭 Show Dashboard per Role
function showDashboardForRole(role) {
    document.getElementById("admin-controls").style.display = role === "admin" ? "block" : "none";
    document.getElementById("student-info-section").style.display = role === "student" ? "block" : "none";
    document.getElementById("driver-location").style.display = role === "driver" ? "block" : "none";
    document.getElementById("map-section").style.display = "block";
}

// 🔑 Google Sign In
function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            db.ref("users/" + user.uid).once("value").then(snap => {
                if (!snap.exists()) {
                    db.ref("users/" + user.uid).set({
                        email: user.email,
                        role: "student" // default role
                    });
                }
            });
        })
        .catch(err => alert(err.message));
}

/* ===============================
   🚍 Admin Functions
=================================*/
// ➕ Add/Edit Bus Schedule
function addSchedule() {
    const busNo = document.getElementById("bus-no").value;
    const route = document.getElementById("bus-route").value;
    const morning = document.getElementById("morning-time").value;
    const evening = document.getElementById("evening-time").value;
    const driver = document.getElementById("driver-name").value;
    const mobile = document.getElementById("driver-mobile").value;

    db.ref("schedules/" + busNo).set({
        busNo, route, morning, evening, driver, mobile
    });
}

// ➕ Add Route & Fee
function addRoute() {
    const route = document.getElementById("route-name").value;
    const distance = document.getElementById("route-distance").value;
    const fee = document.getElementById("route-fee").value;

    db.ref("routes/" + route).set({ route, distance, fee });
}

// ➕ Add Student
document.getElementById("saveBtn").addEventListener("click", () => {
    const roll = document.getElementById("student-roll").value;
    const name = document.getElementById("student-name").value;
    const route = document.getElementById("student-route").value;
    const year = document.getElementById("student-year").value;
    const balance = document.getElementById("student-balance").value;

    db.ref("students/" + roll).set({
        roll, name, route, year, balance
    });
});

// ➕ Add Driver
document.getElementById("driverForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("driverName").value;
    const busNo = document.getElementById("busNo").value;
    const route = document.getElementById("route").value;

    db.ref("drivers/" + busNo).set({ name, busNo, route });
});

/* ===============================
   🎓 Student Functions
=================================*/
function checkMyFees() {
    const roll = document.getElementById("student-search-roll").value;
    db.ref("students/" + roll).once("value").then(snap => {
        if (snap.exists()) {
            const s = snap.val();
            document.getElementById("my-fees-info").innerText =
                `Name: ${s.name}, Route: ${s.route}, Balance: ₹${s.balance}`;
        } else {
            document.getElementById("my-fees-info").innerText = "No record found!";
        }
    });
}

/* ===============================
   🚖 Driver Functions
=================================*/
function sendLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported!");
        return;
    }

    navigator.geolocation.watchPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const busNo = document.getElementById("busNumber").value || "UnknownBus";

        db.ref("locations/" + busNo).set({ lat, lng, timestamp: Date.now() });
        document.getElementById("location-status").innerText = `Sending location: ${lat}, ${lng}`;
    });
}

/* ===============================
   🗺️ Map (Leaflet)
=================================*/
let map = L.map("map").setView([20.5937, 78.9629], 5); // India center
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

let busMarkers = {};

db.ref("locations").on("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).forEach(busNo => {
        const { lat, lng } = data[busNo];
        if (!busMarkers[busNo]) {
            busMarkers[busNo] = L.marker([lat, lng]).addTo(map).bindPopup(busNo);
        } else {
            busMarkers[busNo].setLatLng([lat, lng]);
        }
    });
});
