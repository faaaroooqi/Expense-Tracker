import { useState, useEffect } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "./utils/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Charts from "./components/Charts";

function App() {
  const [transactionName, setTransactionName] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [editId, setEditId] = useState(null); // Firestore doc ID for editing

  const transactionsCollection = collection(db, "transactions");

  // Fetch all transactions
 const fetchTransactions = async () => {
  const snapshot = await getDocs(transactionsCollection);
  const txns = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: String(d.id), // always use Firestore doc ID as string
      ...data,
      // If old docs had "id" field, ignore it
    };
  });
  setTransactions(txns);
};

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Add or Update Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      if (!transactionName.trim() || !transactionAmount) {
         toast.error("Please enter both transaction name and amount");
        return;
      }

      const newTransaction = {
        name: transactionName.trim(),
        amount: Number(transactionAmount),
        type: Number(transactionAmount) >= 0 ? "income" : "expense",
        date: new Date().toISOString(),
      };

      if (editId) {
        // Update existing transaction
        const txnRef = doc(db, "transactions", editId);
        await updateDoc(txnRef, newTransaction);
        setEditId(null);
      } else {
        // Add new transaction
        await addDoc(transactionsCollection, newTransaction);
      }

      setTransactionName("");
      setTransactionAmount("");
      toast.success("Transaction saved successfully!");
      fetchTransactions();
    } catch (err) {
      console.error("Error in handleAddTransaction:", err);
      toast.error("Something went wrong while saving your transaction.");
    }
  };

  // Edit Transaction (pre-fill form)
  const handleEditTransaction = (id) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) {
      toast.error("This transaction no longer exists.");
      return;
    }
    setTransactionName(txn.name);
    setTransactionAmount(txn.amount);
    setEditId(id);
  };

  // Delete Single Transaction
  const handleDeleteTransaction = async (id) => {
    try {
      const txnRef = doc(db, "transactions", id);
      await deleteDoc(txnRef);
      fetchTransactions();
    } catch (err) {
      console.error("Error in handleDeleteTransaction:", err);
    }
  };

  // Clear All Transactions
  const handleClearAll = () => {
  if (transactions.length === 0) {
    toast.info("No transactions to clear.");
    return;
  }

  toast(
    ({ closeToast }) => (
      <div>
        <p>Are you sure you want to clear all transactions?</p>
        <div style={{display:"flex", gap:"12px"}}>
        <button className="btn clear-btn"
          onClick={async () => {
            const deletePromises = transactions.map((txn) =>
              deleteDoc(doc(db, "transactions", txn.id)).catch(() => null)
            );
            await Promise.all(deletePromises);
            fetchTransactions();
            toast.success("All transactions cleared!");
            closeToast();
          }}
        >
          Yes
        </button>
        <button onClick={closeToast} className="btn">No</button>
      </div>
      </div>
    ),
    { autoClose: false }
  );
};


  const totalBalance = transactions.reduce(
    (acc, curr) => acc + curr.amount,
    0
  );

  return (
    <div className="app-container">
      <div className="card left-panel">
        <h1 className="heading">Expense Tracker</h1>

        {/* Transaction Inputs */}
        <input
          type="text"
          placeholder="Transaction Name"
          value={transactionName}
          onChange={(e) => setTransactionName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Transaction Amount (+ income, - expense)"
          value={transactionAmount}
          onChange={(e) => setTransactionAmount(e.target.value)}
        />
        <button className="btn" onClick={handleAddTransaction}>
          {editId ? "Update Transaction" : "Add Transaction"}
        </button>
        <button className="btn clear-btn" onClick={handleClearAll}>
          Clear All
        </button>

        {/* Summary */}
        <div className="summary">
          <p>You have saved: ${totalBalance}</p>
        </div>

        {/* Transaction List */}
        <ul className="transactions-list">
          {transactions.map((txn) => (
            <li
              key={txn.id}
              className={
                txn.amount >= 0 ? "transaction income" : "transaction expense"
              }
            >
              <span>{txn.name}</span>
              <span>${txn.amount}</span>
              <span className="actions">
                {/* Edit Icon */}
                <svg
                  onClick={() => handleEditTransaction(txn.id)}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="blue"
                  viewBox="0 0 16 16"
                  style={{ cursor: "pointer", marginRight: "8px" }}
                >
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1a.5.5 0 0 1-.708 0L10.5 1.207 11.793.914l3.709 3.708zM10.5 2.707l-9 9V14h2.293l9-9-2.793-2.793z" />
                </svg>

                {/* Delete Icon */}
                <svg
                  onClick={() => handleDeleteTransaction(txn.id)}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="red"
                  viewBox="0 0 16 16"
                  style={{ cursor: "pointer" }}
                >
                  <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-8zM14 3.5V4h-1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4H2v-.5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1H13a1 1 0 0 1 1 1z" />
                </svg>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card right-panel">
        <Charts transactions={transactions} />
      </div>
     <ToastContainer 
         className={"confirm-toast"}
         position="top-right"  
         autoClose={3000}
         hideProgressBar={true}
         closeButton={false}
         theme="dark"
      />
    </div>
    
  );
}

export default App;
