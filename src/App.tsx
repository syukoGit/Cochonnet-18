import Logo from "/logo.png";
import "./App.css";

function App() {
  return (
    <>
      <img src={Logo} className="App-logo" alt="logo" />
      <div>
        <h1>Cochonnet-18</h1>
        <p>Logiciel de gestion de tournoi de pétanque</p>
      </div>
    </>
  );
}

export default App;
