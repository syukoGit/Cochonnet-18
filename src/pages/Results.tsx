import { useAppSelector } from '../store/hooks';
import { extractTournamentResults } from '../utils/tournamentResults';
import './Results.css';

function Results() {
  const teams = useAppSelector((state) => state.event.teams);
  const phase2Brackets = useAppSelector((state) => state.event.phase2Brackets);
  const eventName = useAppSelector((state) => state.event.name);

  const results = extractTournamentResults(
    phase2Brackets?.winners || null,
    phase2Brackets?.consolation || null,
    teams
  );

  // If tournaments are not finished, show message
  if (!results.bothFinished) {
    return (
      <div className="results-wrapper">
        <h1>Résultats du tournoi</h1>
        <div className="results-not-available">
          <p>Les résultats ne sont pas encore disponibles.</p>
          <p>Les deux tournois doivent être terminés pour afficher les résultats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-wrapper">
      <h1>Résultats du tournoi</h1>
      {eventName && <h2>{eventName}</h2>}
      
      <div className="results-container">
        {/* Winners Tournament Results */}
        <div className="tournament-results">
          <h3>Tournoi des gagnants</h3>
          <div className="podium">
            <div className="position">
              <div className="medal gold">🥇</div>
              <div className="position-label">1ère place</div>
              <div className="team-info">
                {results.winners.first ? (
                  <>
                    <span className="team-id">{results.winners.first.id}</span>
                    <span className="team-name">{results.winners.first.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
            
            <div className="position">
              <div className="medal silver">🥈</div>
              <div className="position-label">2ème place</div>
              <div className="team-info">
                {results.winners.second ? (
                  <>
                    <span className="team-id">{results.winners.second.id}</span>
                    <span className="team-name">{results.winners.second.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
            
            <div className="position">
              <div className="medal bronze">🥉</div>
              <div className="position-label">3ème place</div>
              <div className="team-info">
                {results.winners.third ? (
                  <>
                    <span className="team-id">{results.winners.third.id}</span>
                    <span className="team-name">{results.winners.third.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consolation Tournament Results */}
        <div className="tournament-results">
          <h3>Tournoi consolante</h3>
          <div className="podium">
            <div className="position">
              <div className="medal gold">🥇</div>
              <div className="position-label">1ère place</div>
              <div className="team-info">
                {results.consolation.first ? (
                  <>
                    <span className="team-id">{results.consolation.first.id}</span>
                    <span className="team-name">{results.consolation.first.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
            
            <div className="position">
              <div className="medal silver">🥈</div>
              <div className="position-label">2ème place</div>
              <div className="team-info">
                {results.consolation.second ? (
                  <>
                    <span className="team-id">{results.consolation.second.id}</span>
                    <span className="team-name">{results.consolation.second.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
            
            <div className="position">
              <div className="medal bronze">🥉</div>
              <div className="position-label">3ème place</div>
              <div className="team-info">
                {results.consolation.third ? (
                  <>
                    <span className="team-id">{results.consolation.third.id}</span>
                    <span className="team-name">{results.consolation.third.name}</span>
                  </>
                ) : (
                  <span className="no-result">-</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;