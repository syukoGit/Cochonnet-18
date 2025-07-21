import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventConfig from "./pages/EventConfig";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<EventConfig />} />
      </Routes>
    </Router>
  );
}

export default App;
