import { Routes, Route } from "react-router-dom";

import Login from "./page/login.jsx";
import Signup from "./page/signup.jsx";
import FinCoachWithAI from "./page/FinCoachWithAI.jsx";
import UpdateFinances from "./page/UpdateFinance.jsx";
import Profile from "./page/Profile.jsx";

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<FinCoachWithAI />} />

      {/* Update Financial Info */}
      <Route path="/update-finances" element={<UpdateFinances />} />

    </Routes>
    


  );
}