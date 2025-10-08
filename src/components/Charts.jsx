import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale);

export default function Charts({ transactions }) {
  const income = transactions.filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expense = transactions.filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pieData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        data: [income, expense],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  const barData = {
    labels: transactions.map((t, i) => `T${i + 1}`),
    datasets: [
      {
        label: "Transaction Amounts",
        data: transactions.map(t => Number(t.amount)),
        backgroundColor: transactions.map(t =>
          t.type === "income" ? "#4caf50" : "#f44336"
        ),
      },
    ],
  };

  return (
    <div className="charts">
      <h2 style={{color:"white", marginLeft:"-200px", fontSize:"large" }}>Expense Insights</h2>
      <div style={{ width: "300px", marginBottom: "30px", }}>
        <Pie data={pieData} />
      </div>
       <div className="chart-divider"></div>
      <div style={{ width: "400px" }}>
        <Bar data={barData} />
      </div>
    </div>
  );
}
