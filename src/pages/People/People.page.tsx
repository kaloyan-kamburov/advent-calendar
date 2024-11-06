/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { remove, database } from "../../config"; // Assuming the correct path to your configuration file
import { ref, onValue } from "firebase/database";
import CalendarCreate from "./CreatePeople.component";
import CalendarEdit from "./EditPeople.component";

const BtnCopy = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-copy"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
};

const PeoplePage = () => {
  const [people, setPeople] = useState<any[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState("");
  const [textCopied, setTextCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  useEffect(() => {
    const peopleRef = ref(database, "people");
    // console.log(peopleRef);

    onValue(peopleRef, (snapshot) => {
      const data = snapshot.val();
      const loadedPeople = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setPeople(loadedPeople);
    });
  }, []);

  const handleDelete = async () => {
    const personRef = ref(database, `people/${deleteConfirm?.id}`);
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
    <div className="people-list">
      <button className="create-btn" onClick={() => setCreateOpen(true)}>
        Create
      </button>
      {people.map((person: any) => (
        <div className="person" key={person.id}>
          <span>{person.name}</span>
          <div className="btns-wrapper">
            <BtnCopy text={window.location.origin + `/${person.name}`} />

            <button
              onClick={() => {
                setEditOpen(person.id);
              }}
            >
              Edit
            </button>

            <button
              onClick={() => {
                setDeleteConfirm(person);
                // handleDelete(person.id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {deleteConfirm && (
        <div className="delete-confirm-mask">
          <div className="delete-confirm-content">
            <p>Are you sure you want to delete {deleteConfirm.name}?</p>
            <div className="btns-wrapper">
              <button onClick={handleDelete}>Yes</button>
              <button onClick={() => setDeleteConfirm(null)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeoplePage;
