/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, FormEvent, useEffect, useState } from "react";
import { database, ref, update } from "../../config";
import { /*getDatabase,*/ onValue } from "firebase/database";
interface Props {
  id: string;
  closeFn: () => void;
}

const slugify = (text: string) => {
  return text.toString().toLowerCase().replace(/\s+/g, "-"); // Replace spaces with -
};
const CalendarEdit: FC<Props> = ({ id, closeFn }) => {
  const [formValues, setFormValues] = useState<any>({});
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Reference to the "people" node in Realtime Database
      const peopleRef = ref(database, `people/${id}`);

      const payload: {
        [key: string]: string;
      } = {
        name: formValues.name,
        slug: slugify(formValues.name),
      };
      [...Array.from(Array(25).keys())].slice(1).forEach((el) => {
        payload[el] = formValues[el];
      });

      // Add a new entry to "people"
      await update(peopleRef, payload);

      closeFn();
      // setName(""); // Clear the input field after submission
    } catch (error) {
      console.error("Error adding person: ", error);
      alert("Failed to add person.");
    }
  };

  const checkValidForm = () => {
    if (!formValues.name) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    // Reference to the specific collection in the database
    const collectionRef = ref(database, `people/${id}`);

    // Function to fetch data from the database
    const fetchData = () => {
      // Listen for changes in the collection
      onValue(collectionRef, (snapshot) => {
        const dataItem = snapshot.val();
        // Check if dataItem exists
        if (dataItem) {
          // Convert the object values into an array
          setFormValues(dataItem);
        }
      });
    };

    // Fetch data when the component mounts
    fetchData();
  }, []);
  return (
    <div className="p-15 w-100">
      <h1>Edit Person</h1>
      <form onSubmit={onSubmit}>
        <div className="input-wrapper">
          <label htmlFor="name">name</label>
          <input
            type="text"
            name="name"
            id="title"
            value={formValues.name}
            onChange={(e) => {
              setFormValues({
                ...formValues,
                name: e.target.value,
              });
            }}
          />
        </div>
        {[...Array.from(Array(25).keys())].slice(1).map((el) => (
          <div className="input-wrapper" key={el}>
            <label htmlFor={`${el}`}>{el}</label>
            <textarea
              name={`${el}`}
              id={`${el}`}
              rows={3}
              value={formValues[el]?.text}
              onChange={(e) => {
                setFormValues({
                  ...formValues,
                  [e.target.name]: {
                    ...formValues[e.target.name],
                    text: e.target.value,
                  },
                });
              }}
            />
          </div>
        ))}
        <button type="submit" disabled={!checkValidForm()}>
          Submit
        </button>
        <button type="button" onClick={closeFn}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CalendarEdit;
