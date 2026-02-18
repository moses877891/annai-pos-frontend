import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import POS from './pages/POS.jsx';
import Dashboard from './pages/Dashboard.jsx';
import api from './utils/api';
import Receipts from './pages/Receipts.jsx';
import Categories from './pages/Categories.jsx';
import CreateProduct from "./pages/CreateProduct.jsx";
import Products from "./pages/Products.jsx";
import ProductImport from "./pages/ProductImport.jsx";
import Promotions from "./pages/Promotions.jsx";

function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ username: '', password: '' });
  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/auth/login', f);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    nav('/pos');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-80 space-y-3">
        <h1 className="text-xl font-semibold text-rose-700">Annai POS Login</h1>
        <input className="border p-2 w-full" placeholder="Username"
               value={f.username} onChange={e=>setF({...f,username:e.target.value})}/>
        <input className="border p-2 w-full" placeholder="Password" type="password"
               value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
        <button className="bg-rose-600 hover:bg-rose-700 text-white w-full py-2 rounded">Login</button>
      </form>
    </div>
  );
}

function Private({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace/>;
}

function Nav() {
  const nav = useNavigate();
  const role = localStorage.getItem('role');

  function logout() {
    localStorage.clear();
    nav('/login');
  }

  return (
    <div className="flex items-center justify-between p-3 border-b bg-white">
      <div className="font-semibold text-rose-700">Annai POS</div>

      <div className="space-x-3 text-sm">

        <Link to="/pos">POS</Link>
        <Link to="/receipts">Receipts</Link>

        {/* Optional Dashboard visibility */}
        {(role === 'admin' || role === 'manager') && (
          <Link to="/promotions">Promotions</Link>
        )}

        {/* Admin-only pages */}
        {role === 'admin' && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/products">Products</Link>
            <Link to="/create-product">New Product</Link>
            <Link to="/import-products">Import</Link>
            <Link to="/promotions">Promotions</Link>
          </>
        )}

        <button onClick={logout} className="text-rose-600">Logout</button>
      </div>
    </div>
  );
}

export default function App() {
  const role = localStorage.getItem('role');
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<Private><><Nav/><POS/></></Private>}/>
        <Route path="/pos" element={<Private><><Nav/><POS/></></Private>}/>
        <Route path="/receipts" element={<Private><><Nav/><Receipts/></></Private>}/>
        {role === 'admin' && (
        <Route path="/dashboard" element={<Private><><Nav/><Dashboard/></></Private>}/>
        )}
        {role === 'admin' && (
        <Route path="/categories" element={<Private><><Nav/><Categories/></></Private>}/>
        )}
        {role === 'admin' && (
        <Route path="/create-product" element={<Private><><Nav/><CreateProduct/></></Private>}/>
        )}
        {role === 'admin' && (
          <Route path="/products" element={<Private><><Nav/><Products/></></Private>} />
        )}
        {role === 'admin' && (
        <Route path="/import-products" element={<Private><><Nav/><ProductImport/></></Private>}/>
        )}
        {role === 'admin' || role === 'manager' && (
        <Route path="/promotions" element={<Private><><Nav/><Promotions/></></Private>}/>
        )}
        <Route path="*" element={<Navigate to="/pos" replace/>}/>
      </Routes>
    </>
  );
}