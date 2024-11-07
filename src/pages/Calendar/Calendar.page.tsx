/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { database } from "../../config"; // Assuming the correct path to your configuration file
import { ref, onValue, update } from "firebase/database";
import { useParams } from "react-router-dom";
import ModalText from "../People/Modal.component";
import Snowfall from "react-snowfall";
import BG from "../../img/bg.png";

const availableDate = (day: number) => {
  return new Date().getDate() >= parseFloat(day.toString());
};

const CalendarPage = () => {
  const [personDetails, setPersonDetails] = useState<any>({});
  const [id, setId] = useState<string>("");
  const params = useParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [modalData, setModalData] = useState<{
    day: number;
    text: string;
  } | null>(null);

  const openDay = async (day: number) => {
    // alert(personDetails[day].text);
    try {
      const personRef = ref(database, `people/${id}`);
      const payload = {
        ...personDetails,
      };
      payload[day] = {
        ...payload[day],
        open: true,
      };
      await update(personRef, payload);

      setModalData({ day, text: personDetails[day].text });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const peopleRef = ref(database, "people");

    onValue(peopleRef, (snapshot) => {
      const data = snapshot.val();
      const findByName = () => {
        for (const key in data) {
          if (data[key].slug === params.name) {
            setId(key);
            return data[key];
          }
        }
      };

      const newPersonDetails = findByName();

      setLoading(false);
      if (!newPersonDetails) {
        alert("Няма такъв човек");
      }
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

  // return (
  //   <div>
  //     <h1>Data from database:</h1>
  //     {/* {people.map((person: any) => (
  //       <div key={person.id}>
  //         <h2>{person.name}</h2>
  //       </div>
  //     ))} */}
  //     {/* <pre>{JSON.stringify(personDetails)}</pre> */}

  //   </div>
  // );
  return (
    <>
      <div className="calender-outer-wrapper">
        {loading ? (
          <div className="loader-wrapper">
            <div className="loader" />
          </div>
        ) : (
          <>
            <div className="calendar-title">
              Календарът на&nbsp;<b>{personDetails?.name}</b>
            </div>
            <div className="calendar-wrapper">
              {[...Array.from(Array(25).keys())].slice(1).map((el) => (
                <div
                  className={`day ${availableDate(el) ? "" : "disabled"}`}
                  key={el}
                  onClick={() => {
                    if (availableDate(el)) {
                      openDay(el);
                    }
                  }}
                >
                  {/* {personDetails[el]} */}
                  <div className="open-msg">
                    {personDetails[el]?.open ? (
                      <svg
                        focusable="false"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        data-testid="DraftsIcon"
                      >
                        <path d="M21.99 8c0-.72-.37-1.35-.94-1.7L12 1 2.95 6.3C2.38 6.65 2 7.28 2 8v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zM12 13 3.74 7.84 12 3l8.26 4.84z"></path>
                      </svg>
                    ) : (
                      <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4-8 5-8-5V6l8 5 8-5z"></path>
                      </svg>
                    )}
                  </div>
                  <div className="date-wrapper">{el}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div
          className="bg"
          style={{
            backgroundImage: `url(${BG})`,
          }}
        ></div>
        <div className="snow-wrapper">
          <Snowfall snowflakeCount={100} />
        </div>
      </div>
      {modalData && (
        <ModalText
          text={modalData.text}
          day={modalData.day}
          closeFn={() => setModalData(null)}
        />
      )}
    </>
  );
};

export default CalendarPage;
