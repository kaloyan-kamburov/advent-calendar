import { FC, FormEvent, useEffect, useState } from "react";
import { database, ref, update } from "../../config";
import { getDatabase, onValue } from "firebase/database";
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
    for (const key in formValues) {
      if (
        [...Array.from(Array(25).keys())].slice(1).some((el) => !formValues[el]?.text) ||
        !formValues.name
      ) {
        return false;
      }
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
    <div>
      edit
      <div onClick={closeFn}>X</div>
      <form onSubmit={onSubmit}>
        <div>
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
          <div key={el}>
            <label htmlFor={`${el}`}>{el}</label>
            <input
              type="text"
              name={`${el}`}
              id={`${el}`}
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
        <pre>{JSON.stringify(formValues, null, 4)}</pre>
        <button type="submit" disabled={!checkValidForm()}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default CalendarEdit;
