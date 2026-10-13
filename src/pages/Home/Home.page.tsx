import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="admin-shell gate">
      <div className="gate-card">
        <p className="eyebrow">December</p>
        <h1>Advent Calendar</h1>
        <p className="gate-copy muted">Each person has their own calendar. The admin is where the days get written.</p>
        <Link className="btn btn-primary" to="/people">
          Open admin
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
