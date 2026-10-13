import { database, push, ref } from "../../config";
import { blankDays, personPayload, type DayEntry } from "../../calendarData";
import PersonForm from "./PersonForm";

type Props = {
  closeFn: () => void;
};

const CalendarCreate = ({ closeFn }: Props) => {
  const onSubmit = async (name: string, days: DayEntry[]) => {
    await push(ref(database, "people"), personPayload(name, days));
    closeFn();
  };

  return (
    <PersonForm
      heading="New calendar"
      initialName=""
      initialDays={blankDays()}
      submitLabel="Create calendar"
      onSubmit={onSubmit}
      onCancel={closeFn}
    />
  );
};

export default CalendarCreate;
