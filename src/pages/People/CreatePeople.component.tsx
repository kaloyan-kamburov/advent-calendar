import { FC, FormEvent, useState } from "react";
import { database, ref, push } from "../../config";

interface Props {
  closeFn: () => void;
}

const slugify = (text: string) => {
  return text.toString().toLowerCase().replace(/\s+/g, "-"); // Replace spaces with -
};

const CalendarCreate: FC<Props> = ({ closeFn }) => {
  const [formValues, setFormValues] = useState<{ [key: string]: string }>({});
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Reference to the "people" node in Realtime Database
      const peopleRef = ref(database, "people");

      const payload: {
        [key: string]:
          | string
          | {
              text: string;
              open: boolean;
            };
      } = {
        name: formValues.name,
        slug: slugify(formValues.name),
      };
      [...Array.from(Array(25).keys())].slice(1).forEach((el) => {
        payload[el] = {
          text: formValues[el],
          open: false,
        };
      });

      // Add a new entry to "people"
      await push(peopleRef, payload);

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

  return (
    <div className="p-15 w-100">
      <h1>Create Person</h1>
      <form onSubmit={onSubmit}>
        <div className="input-wrapper">
          <label htmlFor="name">name</label>
          <input
            type="text"
            name="name"
            id="title"
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
              onChange={(e) => {
                setFormValues({
                  ...formValues,
                  [e.target.name]: e.target.value || "",
                });
              }}
            />
          </div>
        ))}
        <button type="submit" className="submit" disabled={!checkValidForm()}>
          Submit
        </button>
        <button onClick={closeFn}>Cancel</button>
      </form>
    </div>
  );
};

export default CalendarCreate;
