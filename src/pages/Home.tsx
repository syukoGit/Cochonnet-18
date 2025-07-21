import { Link } from 'react-router-dom';
import Logo from '/logo.png';
import './Home.css';

function Home() {
  return (
    <div id="home" className="home-container">
      <img src={Logo} className="App-logo" alt="logo" />
      <div>
        <h1>Cochonnet-18</h1>
        <p>Logiciel de gestion de tournoi de pétanque</p>
        <Link to="/config">
          <button>Créer un évènement</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
