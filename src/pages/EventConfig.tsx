import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTeam, setMatches, setName, setRounds } from '../store/eventSlice';
import { generateRounds } from '../utils/schedule';
import { useNavigate } from 'react-router-dom';
import './EventConfig.css';
import FloatingLabelInput from '../components/FloatingLabelInput';

function EventConfig() {
  const dispatch = useAppDispatch();
  const { name, matches, teams } = useAppSelector((state) => state.event);
  const [newTeam, setNewTeam] = useState('');
  const navigate = useNavigate();

  const handleAddTeam = () => {
    if (newTeam.trim()) {
      dispatch(addTeam(newTeam));
      setNewTeam('');
    }
  };

  return (
    <div className="config-wrapper">
      <h1 className="config-title">Configuration de l'évènement</h1>
      <div className="config-container">
        <div className="left-panel">
          <FloatingLabelInput
            id="event-name"
            label="Nom de l'évènement"
            value={name}
            onChange={(e) => dispatch(setName(e.target.value))}
          />
          <FloatingLabelInput
            id="nb-matches"
            label="Nombre de matchs par équipe"
            type="number"
            value={matches.toString()}
            onChange={(e) => dispatch(setMatches(Number(e.target.value)))}
          />
        </div>
        <h4 className="team-list-header">{teams.length} équipes</h4>
        <div className="team-list-container">
          <table className="team-list-table">
            <thead>
              <tr>
                <th className="team-id-col">ID</th>
                <th className="team-name-col">Nom</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td className="team-id-col">{team.id}</td>
                  <td className="team-name-col">{team.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="team-add">
          <FloatingLabelInput
            id="team-name"
            label="Ajouter une équipe"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            type="text"
            name="team-name"
          />
          <button type="button" onClick={handleAddTeam}>
            Ajouter
          </button>
        </div>
      </div>
      <button
        className="start-button"
        type="button"
        onClick={() => {
          const rounds = generateRounds(
            teams.map((team) => team.name),
            matches
          );
          if (!rounds) {
            window.alert(
              "Nombre de matchs trop élevé pour le nombre d'équipes"
            );
            return;
          }
          dispatch(setRounds(rounds));
          navigate('/phase1');
        }}
      >
        Démarrer
      </button>
    </div>
  );
}

export default EventConfig;
