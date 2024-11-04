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
    for (const key in formValues) {
      if (
        !formValues[key].trim() ||
        [...Array.from(Array(25).keys())].slice(1).some((el) => !formValues[el])
      ) {
        return false;
      }
    }
    return true;
  };

  return (
    <div>
      <div className="close" onClick={closeFn}>
        X
      </div>
      <form onSubmit={onSubmit}>
        <div>
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
          <div key={el}>
            <label htmlFor={`${el}`}>{el}</label>
            <input
              type="text"
              name={`${el}`}
              id={`${el}`}
              onChange={(e) => {
                setFormValues({
                  ...formValues,
                  [e.target.name]: e.target.value,
                });
              }}
            />
          </div>
        ))}
        <pre>{JSON.stringify(formValues)}</pre>
        <button type="submit" disabled={!checkValidForm()}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default CalendarCreate;
