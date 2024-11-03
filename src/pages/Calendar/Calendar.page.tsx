/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from "react";
import { app } from "../../config"; // Assuming the correct path to your configuration file
import { ref, onValue, getDatabase } from "firebase/database";

const CalendarPage = () => {
  const { name } = useParams();

  const [data, setData] = useState<any>([]);
  const [people, setPeople] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState("");

  useEffect(() => {
    const database = getDatabase(app);
    const peopleRef = ref(database, "people");
    // console.log(peopleRef);

    onValue(peopleRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);
      const loadedPeople = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setPeople(loadedPeople);
    });
  }, []);

  // useEffect(() => {
  //   // Initialize the Firebase database with the provided configuration
  //   const database = getDatabase(app);

  //   // Reference to the specific collection in the database
  //   const collectionRef = ref(database, "people");

  //   // Function to fetch data from the database
  //   const fetchData = () => {
  //     // Listen for changes in the collection
  //     onValue(collectionRef, (snapshot) => {
  //       const dataItem = snapshot.val();
  //       console.log(dataItem);
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

  return createOpen ? (
    <CalendarCreate closeFn={() => setCreateOpen(false)} />
  ) : editOpen ? (
    <CalendarEdit id={editOpen} closeFn={() => setEditOpen("")} />
  ) : (
    <div>
      <h1>Data from database:</h1>
      <button onClick={() => setCreateOpen(true)}>Create</button>
      {JSON.stringify(data)}

      {people.map((person: any) => (
        <div key={person.id}>
          <h2>{person.name}</h2>
          <button
            onClick={() => {
              setEditOpen(person.id);
            }}
          >
            Edit
          </button>
        </div>
      ))}
      {/* <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul> */}
    </div>
  );
};

export default CalendarPage;
