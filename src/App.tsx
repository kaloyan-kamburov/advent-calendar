// import React, { useEffect, useState } from "react";
// import app from "./config"; // Assuming the correct path to your configuration file
// import { getDatabase, ref, onValue } from "firebase/database";

// App.js

// function App() {
// const [data, setData] = useState<any>([]);

// useEffect(() => {
//   // Initialize the Firebase database with the provided configuration
//   const database = getDatabase(app);

//   // Reference to the specific collection in the database
//   const collectionRef = ref(database, "test_collection");

//   // Function to fetch data from the database
//   const fetchData = () => {
//     // Listen for changes in the collection
//     onValue(collectionRef, (snapshot) => {
//       const dataItem = snapshot.val();

//       // Check if dataItem exists
//       if (dataItem) {
//         // Convert the object values into an array
//         const displayItem = Object.values(dataItem);
//         setData(displayItem);
//       }
//     });
//   };

//   // Fetch data when the component mounts
//   fetchData();
// }, []);

// return (
//   <div>
//     <h1>Data from database:</h1>
//     <ul>
//       {data.map((item, index) => (
//         <li key={index}>{item}</li>
//       ))}
//     </ul>
//   </div>
// );
// }

// export default App;

// App.js
// import React from "react";
import { AuthProvider } from "./AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home.page";
import Calendar from "./pages/Calendar/Calendar.page";
import Login from "./pages/Login/Login.page";
import People from "./pages/People/People.page";
import PrivateRoute from "./pages/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:name" element={<Calendar />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/people"
            element={
              <PrivateRoute>
                <People />
              </PrivateRoute>
            }
          />
          {/* <Route path="/protected" element={<ProtectedPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
