import { useState, useEffect } from "react";
import { apiFetch } from "./api";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({
    nama: "",
    alamat: "",
    tanggal_lahir: "",
  });
  const [phones, setPhones] = useState([]);

  useEffect(() => {
    if (token) loadContacts();
  }, [token]);

  async function loadContacts() {
    try {
      const data = await apiFetch("/contacts");
      setContacts(data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      const endpoint = view === "login" ? "/login" : "/register";
      const data = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (e) {
      setError(e.message);
    }
  }

  async function logout() {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch (e) {
      // ignore, log out locally regardless
    }
    localStorage.removeItem("token");
    setToken(null);
    setContacts([]);
  }

  async function addContact(e) {
    e.preventDefault();
    try {
      const validPhones = phones.filter((p) => p.nomor_telepon.trim() !== "");
      const payload = {
        ...newContact,
        ...(validPhones.length > 0 ? { phones: validPhones } : {}),
      };
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setNewContact({ nama: "", alamat: "", tanggal_lahir: "" });
      setPhones([]);
      loadContacts();
    } catch (e) {
      setError(e.message);
    }
  }

  function addPhoneRow() {
    setPhones([...phones, { jenis: "HP", nomor_telepon: "" }]);
  }

  function updatePhoneRow(index, field, value) {
    const updated = [...phones];
    updated[index][field] = value;
    setPhones(updated);
  }

  function removePhoneRow(index) {
    setPhones(phones.filter((_, i) => i !== index));
  }

  async function deleteContact(id) {
    await apiFetch(`/contacts/${id}`, { method: "DELETE" });
    loadContacts();
  }

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{view === "login" ? "Welcome back" : "Create an account"}</h2>
            <p>
              {view === "login"
                ? "Sign in to manage your contacts"
                : "Sign up to get started"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="form-group">
            {view === "register" && (
              <input
                className="input-field"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
            <input
              className="input-field"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">
              {view === "login" ? "Login" : "Register"}
            </button>
          </form>

          {error && <div className="error-banner">{error}</div>}

          <button
            className="btn btn-outline"
            onClick={() => setView(view === "login" ? "register" : "login")}
          >
            {view === "login"
              ? "Need an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h2>Contacts</h2>
        <button className="btn btn-logout" onClick={logout}>
          Logout
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={addContact} className="add-card">
        <div className="add-contact-grid">
          <input
            className="input-field"
            placeholder="Nama"
            value={newContact.nama}
            onChange={(e) =>
              setNewContact({ ...newContact, nama: e.target.value })
            }
          />
          <input
            className="input-field"
            placeholder="Alamat"
            value={newContact.alamat}
            onChange={(e) =>
              setNewContact({ ...newContact, alamat: e.target.value })
            }
          />
          <input
            className="input-field"
            type="date"
            value={newContact.tanggal_lahir}
            onChange={(e) =>
              setNewContact({ ...newContact, tanggal_lahir: e.target.value })
            }
          />
        </div>

        <div className="phones-section">
          <span className="phones-label">Phones (optional)</span>
          {phones.map((p, i) => (
            <div key={i} className="phone-row">
              <select
                className="select-field"
                value={p.jenis}
                onChange={(e) => updatePhoneRow(i, "jenis", e.target.value)}
              >
                <option value="Rumah">Rumah</option>
                <option value="HP">HP</option>
                <option value="Kantor">Kantor</option>
              </select>
              <input
                className="input-field"
                placeholder="Nomor Telepon"
                value={p.nomor_telepon}
                onChange={(e) =>
                  updatePhoneRow(i, "nomor_telepon", e.target.value)
                }
              />
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={() => removePhoneRow(i)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add-phone"
            onClick={addPhoneRow}
          >
            + Add Phone
          </button>
        </div>

        <button type="submit" className="btn btn-full btn-primary">
          Add Contact
        </button>
      </form>

      {contacts.length === 0 ? (
        <div className="empty-state">No contacts yet. Add one above.</div>
      ) : (
        <ul className="contacts-grid">
          {contacts.map((c) => (
            <li key={c.id} className="contact-card">
              <div className="contact-info">
                <div className="contact-avatar">{c.nama.charAt(0)}</div>
                <div className="contact-details">
                  <h4>{c.nama}</h4>
                  <p>
                    <span>{c.alamat}</span>
                    <span>{c.tanggal_lahir}</span>
                  </p>
                  {c.phones && c.phones.length > 0 && (
                    <div className="phone-tags">
                      {c.phones.map((ph) => (
                        <span key={ph.id} className="phone-tag">
                          {ph.jenis}: {ph.nomor_telepon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>  
              </div>
              <button
                className="btn btn-danger-ghost"
                onClick={() => deleteContact(c.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
