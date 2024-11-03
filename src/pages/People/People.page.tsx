/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { app, remove, database } from "../../config"; // Assuming the correct path to your configuration file
import { ref, onValue, getDatabase } from "firebase/database";
import CalendarCreate from "./CreatePeople.component";
import CalendarEdit from "./EditPeople.component";

const PeoplePage = () => {
  const [people, setPeople] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState("");

  useEffect(() => {
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

  const handleDelete = async (id) => {
    const personRef = ref(database, `people/${id}`);
    try {
      await remove(personRef);
      // alert("Person deleted successfully!");
    } catch (error) {
      console.error("Error deleting person: ", error);
      alert("Failed to delete person.");
    }
  };

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

          <button
            onClick={() => {
              handleDelete(person.id);
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default PeoplePage;
