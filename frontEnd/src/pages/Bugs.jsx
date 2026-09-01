import { useEffect, useState } from 'react';
import API from '../services/api';

export default function Bugs() {
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    API.get('/bugs')
      .then((response) => {
        setBugs(response.data.bugs);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div>
      <h1>Bugs</h1>

      {bugs.map((bug) => (
        <div
          key={bug._id}
          style={{
            background: 'white',
            padding: '15px',
            marginBottom: '10px',
            border: '1px solid #ddd'
          }}
        >
          <h3>{bug.title}</h3>
          <p>{bug.description}</p>
          <p>
            Severity: <strong>{bug.severity}</strong>
          </p>
          <p>
            Priority: <strong>{bug.priority}</strong>
          </p>
          <p>Status: {bug.status}</p>
        </div>
      ))}
    </div>
  );
}