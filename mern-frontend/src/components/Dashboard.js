import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';

const Dashboard = () => {
    const [month, setMonth] = useState('03');
    const [transactions, setTransactions] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [barChartData, setBarChartData] = useState({});
    const [pieChartData, setPieChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [transactionsResponse, statisticsResponse, barChartResponse, pieChartResponse] = await Promise.all([
                axios.get(`/transactions?month=${month}`),
                axios.get(`/statistics?month=${month}`),
                axios.get(`/barchart?month=${month}`),
                axios.get(`/piechart?month=${month}`)
            ]);

            setTransactions(transactionsResponse.data || []);
            setStatistics(statisticsResponse.data || {});

            if (barChartResponse.data && Array.isArray(barChartResponse.data)) {
                setBarChartData({
                    labels: barChartResponse.data.map(item => item.range),
                    datasets: [{
                        label: 'Number of items',
                        data: barChartResponse.data.map(item => item.count),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)'
                    }]
                });
            } else {
                setBarChartData({});
            }

            if (pieChartResponse.data && Array.isArray(pieChartResponse.data)) {
                setPieChartData({
                    labels: pieChartResponse.data.map(item => item._id),
                    datasets: [{
                        label: 'Number of items',
                        data: pieChartResponse.data.map(item => item.count),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                    }]
                });
            } else {
                setPieChartData({});
            }
        } catch (error) {
            setError('Error fetching data');
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <div>
                <label>Select Month: </label>
                <select value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
            </div>
            <h3>Transactions Table</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Date of Sale</th>
                        <th>Sold</th>
                        <th>Category</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td>{transaction.id}</td>
                            <td>{transaction.title}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.price}</td>
                            <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
                            <td>{transaction.sold ? 'Yes' : 'No'}</td>
                            <td>{transaction.category}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3>Transactions Statistics</h3>
            <div>
                <p>Total Sale Amount: ${statistics.totalAmount || 0}</p>
                <p>Total Sold Items: {statistics.totalSoldItems || 0}</p>
                <p>Total Not Sold Items: {statistics.totalNotSoldItems || 0}</p>
            </div>
            <h3>Transactions Bar Chart</h3>
            <Bar data={barChartData} />
            <h3>Transactions Pie Chart</h3>
            <Pie data={pieChartData} />
        </div>
    );
};

export default Dashboard;
