/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { database } from "../../config"; // Assuming the correct path to your configuration file
import { ref, onValue } from "firebase/database";
import { useParams } from "react-router-dom";

const PeoplePage = () => {
  const [personDetails, setPersonDetails] = useState<any>({});
  const params = useParams();

  useEffect(() => {
    const peopleRef = ref(database, "people");
    // console.log(peopleRef);

    onValue(peopleRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);

      const peopleData: any = {};

      const findByName = () => {
        for (const key in data) {
          if (data[key].name === params.name) {
            return data[key];
          }
        }
      };

      const newPersonDetails = findByName();
      console.log(newPersonDetails);

      setPersonDetails(newPersonDetails);
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

  return (
    <div>
      <h1>Data from database:</h1>
      {/* {people.map((person: any) => (
        <div key={person.id}>
          <h2>{person.name}</h2>
        </div>
      ))} */}
      <pre>{JSON.stringify(personDetails)}</pre>
    </div>
  );
};

export default PeoplePage;
