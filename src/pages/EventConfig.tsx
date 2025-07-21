import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTeam, setMatches, setName } from '../store/eventSlice';
import './EventConfig.css';

function EventConfig() {
  const dispatch = useAppDispatch();
  const { name, matches, teams } = useAppSelector((state) => state.event);
  const [newTeam, setNewTeam] = useState('');

  const handleAddTeam = () => {
    if (newTeam.trim()) {
      dispatch(addTeam(newTeam));
      setNewTeam('');
    }
  };

  return (
    <div className="config-wrapper">
      <div className="config-container">
        <div className="left-panel">
          <div className="field">
            <label>Nom de l&apos;évènement</label>
            <input
              type="text"
              value={name}
              onChange={(e) => dispatch(setName(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Nombre de matchs par équipe</label>
            <input
              type="number"
              min={1}
              value={matches}
              onChange={(e) => dispatch(setMatches(Number(e.target.value)))}
            />
          </div>
        </div>
        <div className="right-panel">
          <div className="team-header">{teams.length} équipes</div>
          <div className="team-list-container">
            <ul className="team-list">
              {teams.map((team) => (
                <li key={team}>{team}</li>
              ))}
            </ul>
          </div>
          <div className="team-add">
            <input
              type="text"
              value={newTeam}
              placeholder="Nom de l'équipe"
              onChange={(e) => setNewTeam(e.target.value)}
            />
            <button onClick={handleAddTeam}>Ajouter</button>
          </div>
        </div>
      </div>
      <button className="start-button">Démarrer</button>
    </div>
  );
}

export default EventConfig;
