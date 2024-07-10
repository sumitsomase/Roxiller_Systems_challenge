import React from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

const App = () => {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Transactions Dashboard</h1>
            </header>
            <Dashboard />
        </div>
    );
};

export default App;

